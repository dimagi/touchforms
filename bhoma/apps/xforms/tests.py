import os
from django.test import TestCase
from bhoma.apps.xforms.models import XForm

class XFormTest(TestCase):
    
    def testFromFile(self):
        file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "xforms")
        for file in os.listdir(file_path):
            print "processing: %s" % file
            model = XForm.from_file(os.path.join(file_path, file))
            print "got back: %s" % model