import os
from django.test import TestCase
from touchforms.formplayer.models import XForm
from django.conf import settings
class XFormTest(TestCase):
    
    def testFromFile(self):
        file_path = settings.XFORMS_BOOTSTRAP_PATH 
        for file in os.listdir(file_path):
            model = XForm.from_file(os.path.join(file_path, file))
        
