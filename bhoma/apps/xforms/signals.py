from django.dispatch import Signal
from bhoma.apps.xforms import const
import logging

xform_saved = Signal(providing_args=["form"])


def add_sha1(sender, form, **kwargs):
    """
    Adds a top level sha-1 attribute to the form based on the xml.
    
    Just connect this up anywhere in your project if you want to 
    add your forms.
    """
    if not const.TAG_SHA1 in form.all_properties():
        form["#sha1"] = form.xml_sha1()
        form.save()
    else:
        current_sha = form.all_properties().get(const.TAG_SHA1, "")
        calculated_sha = form.xml_sha1()
        if current_sha != calculated_sha:
            logging.error("bad sha-1 calculation for form %s, was %s but expected %s... overriding" % \
                          (form.get_id, current_sha, calculated_sha))
            form["#sha1"] = calculated_sha
            form.save()