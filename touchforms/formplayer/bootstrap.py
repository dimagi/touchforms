import os
import logging
import hashlib
from django.db import transaction
from django.conf import settings
from touchforms.formplayer.models import XForm

def bootstrap():
    try:
        # create xform objects for everything in the configured directory,
        # if we don't already have them
        if hasattr(settings, "XFORMS_BOOTSTRAP_PATH"):
            files = os.listdir(settings.XFORMS_BOOTSTRAP_PATH)
            logging.debug("bootstrapping forms in %s" % settings.XFORMS_BOOTSTRAP_PATH)
            for filename in files:
                try:
                    # TODO: is this sneaky lazy loading a reasonable idea?
                    full_name = os.path.join(settings.XFORMS_BOOTSTRAP_PATH, filename)
                    file = open(full_name, "r")
                    checksum = hashlib.sha1(file.read()).hexdigest()
                    file.close()
                    if XForm.objects.filter(checksum=checksum).count() > 0:
                        logging.debug("skipping %s, already loaded" % filename)
                    else:
                        xform = XForm.from_file(full_name)
                        logging.debug("created: %s from %s" % (xform, filename))
                except IOError, e:
                    logging.exception("Problem loading file: %s" % filename)
                except Exception, e:
                    logging.exception("Unknown problem bootstrapping file: %s" % filename)
                finally:
                    file.close()
        else:
            logging.debug("no formplayer XFORMS_BOOTSTRAP_PATH path specified, no forms to sync.")
    except Exception, e:
        transaction.rollback_unless_managed()
        logging.error(("Problem bootstrapping formplayer: %s.  Ignoring.  If the " \
                       "application seems broken, this is probably why") % e)
        
        return
        
