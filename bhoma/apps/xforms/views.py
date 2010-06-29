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
        
        # get the instance
        instance = request.POST["output"]
        # post to couch
        doc = post_xform_to_couch(instance)
        # call the callback, if there, otherwise route back to the 
        # xforms list
        if callback:
            return callback(xform, doc)
        else:
            return HttpResponseRedirect(reverse("xform_list"))
    
    preloader_data_js = json.dumps(preloader_data)
    return render_to_response(request, "xforms/touchscreen.html",
                              {"xform": xform,
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
