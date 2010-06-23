from bhoma.utils.render_to_response import render_to_response
from django.shortcuts import get_object_or_404
from django.conf import settings
from bhoma.apps.xforms.models import XForm
from bhoma.apps.xforms.util import get_xform_instance
from bhoma.utils.post import post_data
from django.http import HttpResponseRedirect, HttpResponse,\
    HttpResponseServerError
from django.core.urlresolvers import reverse
from bhoma.apps.xforms.models.couch import CXFormInstance
import logging


def play(request, xform_id):
    """Play an XForm"""
    xform = get_object_or_404(XForm, id=xform_id)
    redirect_url = request.GET.get('redirect_url', '')
    if request.POST:
        # get the instance
        instance = get_xform_instance()
        # post to couch
        response, errors = post_data(instance, settings.XFORMS_POST_URL)
        if not errors:
            doc_id = response
            doc = CXFormInstance.get_db().get(doc_id)
            for key, value in request.GET.items():
                if key not in doc and key not in ["redirect_url"]:
                    # in order to not conflict with potential xform
                    # properties we prefix our custom attributes with
                    # a hash
                    doc["#%s" % key] = value
            CXFormInstance.get_db().save_doc(doc)
            
            # make the callbacks
            for callback in xform.callbacks.all():
                callback.call(doc)
                
            if redirect_url:
                return HttpResponseRedirect(redirect_url)
            else:
                return HttpResponseRedirect(reverse("xform_list"))
        else:
            raise Exception(errors)
        
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
