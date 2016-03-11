import os
from django.test import SimpleTestCase
from touchforms.formplayer.models import XForm
from django.conf import settings

THISDIR = os.path.dirname(os.path.abspath(__file__))
DEMO_FORMS = os.path.join(THISDIR, 'demo_forms')


class XFormTest(SimpleTestCase):
    def testFromFile(self):
        for file_name in os.listdir(DEMO_FORMS):
            if not file_name.startswith('.'):
                model = XForm.from_file(os.path.join(DEMO_FORMS, file_name))
                self.assertEqual(model.name, file_name)
