from django.shortcuts import get_object_or_404
from django.conf import settings
from xformplayer.models import XForm
from django.http import HttpResponseRedirect, HttpResponse,\
    HttpResponseServerError
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
from xformplayer.signals import xform_received
from django.template.context import RequestContext
from django.shortcuts import render_to_response
import tempfile
import os

def xform_list(request):
    forms_by_namespace = defaultdict(list)
    success = True
    notice = ""
    if request.method == "POST" and request.FILES["file"]:
        file = request.FILES["file"]
        try:
            tmp_file_handle, tmp_file_path = tempfile.mkstemp()
            tmp_file = open(tmp_file_path, "w")
            tmp_file.write(file.read())
            tmp_file.close()
            new_form = XForm.from_file(tmp_file_path, str(file))
            notice = "Created form: %s " % file
        except Exception, e:
            logging.error("Problem creating xform from %s: %s" % (file, e))
            success = False
            notice = "Problem creating xform from %s: %s" % (file, e)
            
            
    for form in XForm.objects.all():
        forms_by_namespace[form.namespace].append(form)
    return render_to_response("xformplayer/xform_list.html", 
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


def play(request, xform_id, callback=None, preloader_data={}):
    """
    Play an XForm.
    
    If you specify callback, instead of returning a response this view
    will call back to your method upon completion (POST).  This allows
    you to call the view from your own view, but specify a callback
    method afterwards to do custom processing and responding.
    
    The callback method should have the following signature:
        response = <method>(xform, document)
    where:
        xform = the django model of the form 
        document = the couch object created by the instance data
        response = a valid http response
    """
    xform = get_object_or_404(XForm, id=xform_id)
    if request.method == "POST":
        if request.POST["type"] == 'form-complete':
            # get the instance
            instance = request.POST["output"]

            # raise signal
            xform_received.send(sender="player", instance=instance)
            
        # call the callback, if there, otherwise route back to the 
        # xformplayer list
        if callback:
            return callback(xform, instance)
        else:
            response = HttpResponse(mimetype='application/xml')
            response.write(instance) 
            return response
    
    preloader_data_js = json.dumps(preloader_data)
    return render_to_response("touchscreen.html",
                              {"form": xform,
                               "mode": 'xform',
                               "preloader_data": preloader_data_js },
                               context_instance=RequestContext(request))
                                    
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
    
