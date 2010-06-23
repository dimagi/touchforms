import os
import logging
import hashlib
from django.db import transaction
from django.conf import settings
from bhoma.apps.xforms.models.django import XForm
from bhoma.utils.logging import log_exception

def bootstrap():
    try:
        # create xform objects for everything in the configured directory,
        # if we don't already have them
        files = os.listdir(settings.XFORMS_FORM_BOOTSTRAP_PATH)
        logging.debug("bootstrapping forms in %s" % settings.XFORMS_FORM_BOOTSTRAP_PATH)
        for filename in files:
            try:
                # TODO: is this sneaky lazy loading a reasonable idea?
                full_name = os.path.join(settings.XFORMS_FORM_BOOTSTRAP_PATH, filename)
                file = open(full_name, "r")
                checksum = hashlib.sha1(file.read()).hexdigest()
                file.close()
                if XForm.objects.filter(checksum=checksum).count() > 0:
                    logging.debug("skipping %s, already loaded" % filename)
                else:
                    xform = XForm.from_file(full_name)
                    logging.debug("created: %s from %s" % (xform, filename))
            except IOError, e:
                logging.error("Problem loading file: %s. %s" % (filename, e))
            except Exception, e:
                logging.error("Unknown problem bootstrapping file: %s. %s" % (filename, e))
                log_exception(e)
            
    except Exception, e:
        transaction.rollback_unless_managed()
        logging.error(("Problem bootstrapping xforms: %s.  Ignoring.  If the " \
                       "application seems broken, this is probably why") % e)
        
        return
        
