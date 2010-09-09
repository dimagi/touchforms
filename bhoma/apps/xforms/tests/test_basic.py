import os
from django.test import TestCase
from bhoma.apps.xforms.models import XForm
from couchdbkit.schema.base import Document
from couchdbkit.schema.properties import StringProperty
from couchdbkit.schema.properties_proxy import SchemaProperty

class XFormTest(TestCase):
    
    def testFromFile(self):
        file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "xforms")
        for file in os.listdir(file_path):
            model = XForm.from_file(os.path.join(file_path, file))
        