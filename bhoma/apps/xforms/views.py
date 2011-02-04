from bhoma.utils.render_to_response import render_to_response
from django.shortcuts import get_object_or_404
from django.conf import settings
from bhoma.apps.xforms.models import XForm
from bhoma.utils.post import post_data
from django.http import HttpResponseRedirect, HttpResponse,\
    HttpResponseServerError
from django.core.urlresolvers import reverse
from bhoma.apps.xforms.models.couch import CXFormInstance
import logging
from django.views.decorators.http import require_POST
from bhoma.apps.xforms.util import post_xform_to_couch
import json
from collections import defaultdict
from bhoma.apps.export.export import export_excel
from StringIO import StringIO
from bhoma.utils.couch import uid
from bhoma.apps.xforms.const import PRELOADER_TAG_UID

def xform_list(request):
    forms_by_namespace = defaultdict(list)
    for form in XForm.objects.all():
        forms_by_namespace[form.namespace].append(form)
    return render_to_response(request, "xforms/xform_list.html", {
        'forms_by_namespace': dict(forms_by_namespace),
    })

def download(request, xform_id):
    """
    Download an xform
    """
    xform = get_object_or_404(XForm, id=xform_id)
    response = HttpResponse(mimetype='application/xml')
    response.write(xform.file.read()) 
    return response

def download_excel(request):
    """
    Download all data for an xform
    """
    namespace = request.GET.get("xmlns", "")
    if not namespace:
        raise Exception("You must specify a namespace to download!")
    tmp = StringIO()
    
    if export_excel(namespace, 'xforms/by_xmlns', tmp):
        response = HttpResponse(mimetype='application/vnd.ms-excel')
        response['Content-Disposition'] = 'attachment; filename=%s.xls' % namespace.split('/')[-1]
        response.write(tmp.getvalue())
        tmp.close()
        return response
    else:
        return HttpResponse("Sorry, there was no data found for the namespace '%s'." % namespace)

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

            # post to couch
            doc = post_xform_to_couch(instance)
        else:
            doc = None

        # call the callback, if there, otherwise route back to the 
        # xforms list
        if callback:
            return callback(xform, doc)
        else:
            return HttpResponseRedirect(reverse("xform_list"))
    
    preloader_data_js = json.dumps(preloader_data)
    return render_to_response(request, "bhoma_touchscreen.html",
                              {"form": xform,
                               "mode": 'xform',
                               "preloader_data": preloader_data_js })
                                    
def player_proxy(request):
    """Proxy to an xform player, to avoid cross-site scripting issues"""
    data = request.raw_post_data if request.method == "POST" else None
    response, errors = post_data(data, settings.XFORMS_PLAYER_URL, content_type="text/json")
    if errors:
        logging.error("Error posting to xform player: %s" % errors)
        return HttpResponseServerError(errors)
    return HttpResponse(response)

@require_POST
def post(request, callback=None):
    """
    XForms can get posted here.  They will be forwarded to couch.
    
    Just like play, if you specify a callback you get called, 
    otherwise you get a generic response.  Callbacks follow
    a different signature as play, only passing in the document
    (since we don't know what xform was being posted to)
    """
    # just forward the post request to couch
    # this won't currently work with ODK
    
    # post to couch
    instance = request.raw_post_data
    doc = post_xform_to_couch(instance)
    if callback:
        return callback(doc)
    return HttpResponse("Thanks! Your new xform id is: %s" % doc["_id"])

def get_preloader_value(request):
    """
    Allows you to define keys that translate to calculated preloader values.
    Currently the only supported value is <uid> which returns a new uid
    """
    param = request.GET.get('param', "")
    if param.lower() == PRELOADER_TAG_UID:
        return HttpResponse(uid.new())
    return HttpResponse(param)
