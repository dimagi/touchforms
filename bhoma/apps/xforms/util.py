from bhoma.apps.xforms.models import XForm
from bhoma.utils.post import post_data, post_authenticated_data
from django.conf import settings
from bhoma.apps.xforms.models import CXFormInstance, CXFormDuplicate
from bhoma.apps.xforms.exceptions import XFormException
from bhoma.utils.logging import log_exception
import logging
from bhoma.apps.xforms.signals import xform_saved
from restkit.errors import RequestFailed
from bhoma.utils.couch import uid
import re

def get_xform_by_namespace(namespace):
    matches = XForm.objects.filter(namespace=namespace).order_by("-version", "-created")
    if matches.count() > 0:
        return matches[0]
    else:
        raise Exception("No XForm found! Either the application wasn't " \
                        "bootstrapped properly or the database entry was " \
                        "deleted. Please syncdb and restart the server.")

def post_from_settings(instance, extras={}):
    url = settings.XFORMS_POST_URL if not extras else "%s?%s" % \
        (settings.XFORMS_POST_URL, "&".join(["%s=%s" % (k, v) for k, v in extras.items()]))
    if settings.BHOMA_COUCH_USERNAME:
        return post_authenticated_data(instance, url, 
                                       settings.BHOMA_COUCH_USERNAME, 
                                       settings.BHOMA_COUCH_PASSWORD)
    else:
        return post_data(instance, url)
    
def post_xform_to_couch(instance):
    """
    Post an xform to couchdb, based on the settings.XFORMS_POST_URL.
    Returns the newly created document from couchdb, or raises an
    exception if anything goes wrong
    """
    def _has_errors(response, errors):
        return errors or "error" in response
    
    # check settings for authentication credentials
    try:
        response, errors = post_from_settings(instance)
        if not _has_errors(response, errors):
            doc_id = response
            try:
                xform = CXFormInstance.get(doc_id)
                # fire signals
                try:
                    xform_saved.send(sender="post", form=xform)
                except Exception, e:
                    logging.error("Problem sending post-save signals for xform %s" % doc_id)
                    log_exception(e)
                raise XFormException("fail!")
                return xform
            except Exception, e:
                logging.error("Problem accessing %s" % doc_id)
                log_exception(e)
                raise
        else:
            raise XFormException("Problem POSTing form to couch! errors/response: %s/%s" % (errors, response))
    except RequestFailed, e:
        if e.status_int == 409:
            # this is an update conflict, i.e. the uid in the form was the same.
            # log it and flag it.
            new_doc_id = uid.new()
            def _extract_id_from_raw_xml(xml):
                # TODO: this is brittle as hell. Fix.
                _PATTERNS = (r"<uid>(\w+)</uid>", r"<uuid>(\w+)</uuid>")
                for pattern in _PATTERNS:
                    if re.search(pattern, xml): return re.search(pattern, xml).groups()[0]
                logging.error("Unable to find conflicting matched uid in form: %s" % xml)
                return ""
            conflict_id = _extract_id_from_raw_xml(instance)
            log_exception(XFormException("Duplicate post for xform!"), 
                                         extra_info="uid from form: %s, duplicate instance %s" % (conflict_id, new_doc_id))
            response, errors = post_from_settings(instance, {"uid": new_doc_id})
            if not _has_errors(response, errors):
                # create duplicate doc
                # get and save the duplicate to ensure the doc types are set correctly
                # so that it doesn't show up in our reports
                dupe = CXFormDuplicate.get(response)
                dupe.save()
            else:
                # how badly do we care about this?
                raise XFormException("Problem POSTing form to couch! errors/response: %s/%s" % (errors, response))
            
        else:
            raise

def value_for_display(value, replacement_chars="_-"):
    """
    Formats an xform value for display, replacing the contents of the 
    system characters with spaces
    """
    for char in replacement_chars:
        value = str(value).replace(char, " ")
    return value