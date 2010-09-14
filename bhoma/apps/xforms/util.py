from bhoma.apps.xforms.models import XForm
from bhoma.utils.post import post_data, post_authenticated_data
from django.conf import settings
from bhoma.apps.xforms.models import CXFormInstance
from bhoma.apps.xforms.exceptions import XFormException
from bhoma.utils.logging import log_exception
import logging
from bhoma.apps.xforms.signals import xform_saved

def get_xform_by_namespace(namespace):
    matches = XForm.objects.filter(namespace=namespace).order_by("-version", "-created")
    if matches.count() > 0:
        return matches[0]
    else:
        raise Exception("No XForm found! Either the application wasn't " \
                        "bootstrapped properly or the database entry was " \
                        "deleted. Please syncdb and restart the server.")
    
def post_xform_to_couch(instance):
    """
    Post an xform to couchdb, based on the settings.XFORMS_POST_URL.
    Returns the newly created document from couchdb, or raises an
    exception if anything goes wrong
    """
    # check settings for authentication credentials
    if settings.BHOMA_COUCH_USERNAME:
        response, errors = post_authenticated_data(instance, settings.XFORMS_POST_URL, 
                                                   settings.BHOMA_COUCH_USERNAME, 
                                                   settings.BHOMA_COUCH_PASSWORD)
    else:
        response, errors = post_data(instance, settings.XFORMS_POST_URL)
    if not errors and not "error" in response:
        doc_id = response
        try:
            xform = CXFormInstance.get(doc_id)
            # fire signals
            try:
                xform_saved.send(sender="post", form=xform)
            except Exception, e:
                logging.error("Problem sending post-save signals for xform %s" % doc_id)
                log_exception(e)
            return xform
        except Exception, e:
            logging.error("Problem accessing %s" % doc_id)
            log_exception(e)
            raise
    else:
        raise XFormException("Problem POSTing form to couch! errors/response: %s/%s" % (errors, response))

def value_for_display(value, replacement_chars="_-"):
    """
    Formats an xform value for display, replacing the contents of the 
    system characters with spaces
    """
    for char in replacement_chars:
        value = str(value).replace(char, " ")
    return value