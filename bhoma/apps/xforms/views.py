from bhoma.utils.render_to_response import render_to_response
from django.shortcuts import get_object_or_404
from bhoma.apps.xforms.models import XForm
from bhoma.apps.xforms.util import get_xform_instance
from bhoma.utils.post import post_data
from bhoma.apps.encounter.encounter import Encounter
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse


def play(request, xform_id):
    """Play an XForm"""
    xform = get_object_or_404(XForm, id=xform_id)
    redirect_url = request.GET.get('redirect_url', '')
    
    if request.POST:
        # get the instance
        instance = get_xform_instance()
        # post to couch
        response, errors = post_data(instance, "http://localhost:5984/patient/_design/xforms/_update/xform/")
        if not errors:
            doc_id = response
            doc = Encounter.get_db().get(doc_id)
            for key, value in request.GET.items():
                if key not in doc and key not in ["redirect_url"]:
                    doc[key] = value
                else: 
                    print "ignoring key, value: %s, %s" % (key, value)
            Encounter.get_db().save_doc(doc)
            if redirect_url:
                return HttpResponseRedirect(redirect_url)
            else:
                return HttpResponseRedirect(reverse("xform_list"))
        else:
            raise Exception(errors)
        
        # process post event hooks... how?

    return render_to_response(request, "xforms/play_xform.html",
                              {"xform": xform})