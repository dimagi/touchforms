from django.core.management.base import LabelCommand
from bhoma.utils.couch.database import get_db
from couchdbkit.consumer import Consumer
from bhoma.const import FILTER_XFORMS
from bhoma.utils.logging import log_exception
import logging
import time
from bhoma.apps.xforms.models import CXFormInstance
from bhoma.apps.xforms.signals import add_sha1

class Command(LabelCommand):
    help = "Listens for xforms and adds sha-1 tags to them."
    args = ""
    label = ""
    
    def handle(self, *args, **options):
        # this has a verrrrrrrrry similar structure to the conflict resolver.
        # we should abstract this out into a base management command class
        db = get_db()
        c = Consumer(db)
        
        def add_sha1_to_line(line):
            try:
                xform_id = line["id"]
                xform = CXFormInstance.get(xform_id)
                add_sha1(None, xform)
            except Exception, e:
                log_exception(e)
        
        c.register_callback(add_sha1_to_line)
        # Go into receive loop waiting for any conflicting patients to
        # come in.
        while True:
            try:
                c.wait(heartbeat=5000, filter=FILTER_XFORMS)
            except Exception, e:
                time.sleep(10)
                logging.warn("caught exception in sha-1 adder: %s, sleeping and restarting" % e)
            
                
    def __del__(self):
        pass
    
