from bhoma.utils.render_to_response import render_to_response
from django.shortcuts import get_object_or_404
from bhoma.apps.xforms.models import XForm
from bhoma.apps.xforms.util import get_xform_instance
from bhoma.utils.post import post_data


def play(request, xform_id):
    """Play an XForm"""
    xform = get_object_or_404(XForm, id=xform_id)
    if request.POST:
        # get the instance
        instance = get_xform_instance()
        # post to couch
        response, errors = post_data(instance, "http://localhost:5984/patient/_design/xforms/_update/xform/")
        print response
        print errors
        
        # process post event hooks... how?
        
        
    return render_to_response(request, "xforms/play_xform.html",
                              {"xform": xform})