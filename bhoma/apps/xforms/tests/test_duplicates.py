import os
from datetime import date
from django.conf import settings
from django.test import TestCase
from bhoma.utils.post import post_authenticated_data
from bhoma.apps.xforms.models.couch import CXFormInstance
from bhoma.apps.xforms.util import post_xform_to_couch

class DuplicateFormTest(TestCase):
    
    def testBasicDuplicate(self):
        file_path = os.path.join(os.path.dirname(__file__), "data", "duplicate.xml")
        
        with open(file_path, "rb") as f:
            xml_data = f.read()
        
        doc = post_xform_to_couch(xml_data)
        self.assertEqual("7H46J37FGH3", doc.get_id)
        self.assertTrue(doc.contributes())
        self.assertEqual("CXFormInstance", doc.doc_type)
        self.assertEqual("XForm", doc["#doc_type"])
        doc = post_xform_to_couch(xml_data)
        self.assertFalse(doc.contributes())
        self.assertEqual("CXFormDuplicate", doc.doc_type)
        self.assertEqual("XFormDuplicate", doc["#doc_type"])
        