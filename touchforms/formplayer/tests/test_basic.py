import os
from django.test import TestCase
from touchforms.formplayer.models import XForm
from django.conf import settings
class XFormTest(TestCase):
    
    def testFromFile(self):
        """
        This test is only run if you have a bootstrap path set.
        
        If that is the case it will sync all your forms and make
        sure there are no errors.
        """
        if hasattr(settings, "XFORMS_BOOTSTRAP_PATH"):
            file_path = settings.XFORMS_BOOTSTRAP_PATH 
            for file in os.listdir(file_path):
                model = XForm.from_file(os.path.join(file_path, file))
            
