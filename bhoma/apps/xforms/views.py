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

def download(request, xform_id):
    """
    Download an xform
    """
    xform = get_object_or_404(XForm, id=xform_id)
    response = HttpResponse(mimetype='application/xml')
    response.write(xform.file.read()) 
    return response
    
    
def play(request, xform_id, callback=None):
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
    if request.POST:
        
        # get the instance
        instance = request.POST["output"]
        # post to couch
        response, errors = post_data(instance, settings.XFORMS_POST_URL)
        if not errors and not "error" in response:
            doc_id = response
            doc = CXFormInstance.get_db().get(doc_id)
            for key, value in request.GET.items():
                if key not in doc and key not in ["redirect_url"]:
                    # in order to not conflict with potential xform
                    # properties we prefix our custom attributes with
                    # a hash
                    doc["#%s" % key] = value
            CXFormInstance.get_db().save_doc(doc)
            
            # CZUE: abandoning callbacks for now so commenting this out...
            # make the callbacks
            # for callback in xform.callbacks.all():
            #    callback.call(doc)
            if callback:
                return callback(xform, doc)
            else:
                return HttpResponseRedirect(reverse("xform_list"))
        else:
            raise Exception("Problem POSTing form errors/response: %s/%s" % (errors, response))
        
        # process post event hooks... how?
    return render_to_response(request, "xforms/xform_player.html",
                              {"xform": xform })
                                    
def player_proxy(request):
    """Proxy to an xform player, to avoid cross-site scripting issues"""
    data = request.raw_post_data if request.POST else None
    response, errors = post_data(data, settings.XFORMS_PLAYER_URL, content_type="text/json")
    if errors:
        logging.error("Error posting to xform player: %s" % errors)
        return HttpResponseServerError(errors)
    return HttpResponse(response)
