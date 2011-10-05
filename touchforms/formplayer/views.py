from django.shortcuts import get_object_or_404
from django.conf import settings
from touchforms.formplayer.models import XForm, PlaySession
from touchforms.formplayer.const import *
from touchforms.formplayer.autocomplete import autocompletion, DEFAULT_NUM_SUGGESTIONS
from django.http import HttpResponseRedirect, HttpResponse,\
    HttpResponseServerError, HttpRequest
from django.core.urlresolvers import reverse
import logging
import httplib
from urlparse import urlparse
import traceback
import sys
from django.views.decorators.http import require_POST
import json
from collections import defaultdict
from StringIO import StringIO
from touchforms.formplayer.signals import xform_received
from django.template.context import RequestContext
from django.shortcuts import render_to_response
import tempfile
import os

def xform_list(request):
    forms_by_namespace = defaultdict(list)
    success = True
    notice = ""
    if request.method == "POST":
        if "file" in request.FILES:
            file = request.FILES["file"]
            try:
                tmp_file_handle, tmp_file_path = tempfile.mkstemp()
                tmp_file = os.fdopen(tmp_file_handle, 'w')
                tmp_file.write(file.read())
                tmp_file.close()
                new_form = XForm.from_file(tmp_file_path, str(file))
                notice = "Created form: %s " % file
            except Exception, e:
                logging.error("Problem creating xform from %s: %s" % (file, e))
                success = False
                notice = "Problem creating xform from %s: %s" % (file, e)
        else:
            success = False
            notice = "No uploaded file set."
            
    for form in XForm.objects.all():
        forms_by_namespace[form.namespace].append(form)
    return render_to_response("formplayer/xform_list.html", 
                              {'forms_by_namespace': dict(forms_by_namespace),
                               "success": success,
                               "notice": notice},
                               
                              context_instance=RequestContext(request))
                              
def download(request, xform_id):
    """
    Download an xform
    """
    xform = get_object_or_404(XForm, id=xform_id)
    response = HttpResponse(mimetype='application/xml')
    response.write(xform.file.read()) 
    return response


def coalesce(*args):
    for arg in args:
        if arg is not None:
            return arg
    return None

def enter_form(request, **kwargs):
    xform_id = kwargs.get('xform_id')
    xform = kwargs.get('xform')
    instance_xml = kwargs.get('instance_xml')
    preloader_data = coalesce(kwargs.get('preloader_data'), {})
    input_mode = coalesce(kwargs.get('input_mode'), 'touch')
    submit_callback = coalesce(kwargs.get('onsubmit'), default_submit)
    abort_callback = coalesce(kwargs.get('onabort'), default_abort)

    if not xform:
        xform = get_object_or_404(XForm, id=xform_id)
        
    if request.method == "POST":
        if request.POST["type"] == 'form-complete':
            instance_xml = request.POST["output"]
            return form_entry_complete(request, xform, instance_xml, submit_callback)

        elif request.POST["type"] == 'form-aborted':
            return form_entry_abort(request, xform, abort_callback)

    return form_entry_new(request, xform, instance_xml, preloader_data, input_mode)

# TODO: instance loading
def form_entry_new(request, xform, instance_xml, preloader_data, input_mode):
    """start a new touchforms/typeforms session"""
    templ = {
        'touch': 'touchforms/touchscreen.html',
        'type': 'typeforms.html',
        'full': 'fullform.html',
    }[input_mode]

    return render_to_response(templ, {
            "form": xform,
            "mode": 'xform',
            "instance_xml": json.dumps(instance_xml),
            "preloader_data": json.dumps(preloader_data),
            "dim": get_player_dimensions(request),
            "fullscreen": request.GET.get('mode', '').startswith('full')
        }, context_instance=RequestContext(request))

def form_entry_abort(request, xform, callback):
    """handle an aborted form entry session"""
    return callback(xform)

def form_entry_complete(request, xform, instance_xml, callback):
    """handle a completed form entry session (xform finished and submitted)"""
    xform_received.send(sender="player", instance=instance_xml)
    return callback(xform, instance_xml)

def default_submit(xform, instance_xml):
    response = HttpResponse(mimetype='application/xml')
    response.write(instance_xml)
    return response

def default_abort(xform, abort_url='/'):
    return HttpResponseRedirect(abort_url)

# this function is here for backwards compatibility; use enter_form() instead
def play(request, xform_id, callback=None, preloader_data=None, input_mode=None):
    """
    Play an XForm.

    xform_id - which xform to play
    callback(xform, instance_xml) - action to perform when form is submitted or aborted (both via POST) 
        default behavior is to display the xml, and return to the form list, respectively
        for abort, instance_xml will be None
    preloader_data - data to satisfy form preloaders: {preloader type => {preload param => preload value}} 
    input_mode - 'touch' for touchforms, 'type' for typeforms
    instance_xml - an xml instance that, if present, will be edited during the form session
    """
    return enter_form(request,
                      xform_id=xform_id,
                      preloader_data=preloader_data,
                      input_mode=input_mode,
                      onsubmit=callback,
                      onabort=default_abort
                      )

def play_remote(request, session_id=None, input_mode=None):
    if not session_id:
        xform = request.POST.get('xform')
        try:
            tmp_file_handle, tmp_file_path = tempfile.mkstemp()
            tmp_file = os.fdopen(tmp_file_handle, 'w')
            tmp_file.write(xform.encode('utf-8'))
            tmp_file.close()
            new_form = XForm.from_file(tmp_file_path, str(file))
            notice = "Created form: %s " % file
        except Exception, e:
            logging.error("Problem creating xform from %s: %s" % (file, e))
            success = False
            notice = "Problem creating xform from %s: %s" % (file, e)
            raise e
        session = PlaySession(
            next=request.POST.get('next'),
            abort=request.POST.get('abort'),
            preloader_data=json.loads(request.POST.get('data')),
            xform_id=new_form.id,
            saved_instance=request.POST.get('instance')
        )
        session.save()
        return HttpResponseRedirect(reverse('xform_play_remote', args=[session._id]))

    session = PlaySession.get(session_id)
    def onsubmit(xform, instance_xml):
        xform.delete()
        session.delete()
        return HttpResponseRedirect(session.next)
    def onabort(xform):
        return HttpResponseRedirect(session.abort if session.abort else session.next)
    return enter_form(request, 
                      xform_id=session.xform_id,
                      preloader_data=session.preloader_data,
                      input_mode=input_mode,
                      onsubmit=onsubmit,
                      onabort=onabort,
                      )

def get_player_dimensions(request):
    def get_dim(getparam, settingname):
        dim = request.GET.get(getparam)
        if not dim:
            try:
                dim = getattr(settings, settingname)
            except AttributeError:
                pass
        return dim

    return {
        'width': get_dim('w', 'TOUCHSCREEN_WIDTH'),
        'height': get_dim('h', 'TOUCHSCREEN_HEIGHT')
    }

def player_proxy(request):
    """Proxy to an xform player, to avoid cross-site scripting issues"""
    data = request.raw_post_data if request.method == "POST" else None
    response = _post_data(data, settings.XFORMS_PLAYER_URL, content_type="text/json")
    return HttpResponse(response)

def _post_data(data, url, content_type):
    up = urlparse(url)
    headers = {}
    headers["content-type"] = content_type
    headers["content-length"] = len(data)
    conn = httplib.HTTPConnection(up.netloc)
    conn.request('POST', up.path, data, headers)
    resp = conn.getresponse()
    results = resp.read()
    return results
    
def api_preload_provider(request):
    param = request.GET.get('param', "")
    param = param.strip().lower()

    value = param
    if param == PRELOADER_TAG_UID:
        import uuid
        value = uuid.uuid4().hex

    return HttpResponse(value)

def api_autocomplete(request):
    domain = request.GET.get('domain')
    key = request.GET.get('key', '')
    max_results = int(request.GET.get('max', str(DEFAULT_NUM_SUGGESTIONS)))

    return HttpResponse(json.dumps(autocompletion(domain, key, max_results)), 'text/json')

def player_abort(request):
    class TimeoutException(Exception):
        pass

    try:
        raise TimeoutException("A touchscreen view has timed out and was aborted")
    except TimeoutException:
        logging.exception('')

    try:
        redirect_to = reverse(settings.TOUCHFORMS_ABORT_DEST)
    except AttributeError:
        redirect_to = '/'

    return HttpResponseRedirect(redirect_to)
