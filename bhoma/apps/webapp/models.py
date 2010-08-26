from django.db.models import Model

from bhoma.apps.webapp.permissions import BHOMA_PERMISSIONS

class Permissions(Model):
    """
    Stub class to hold permissions.
    """
       
    class Meta():
        permissions = (('bhoma_view_pi_reports', "Can view clinic performance indicator reports."),
                       ('bhoma_enter_data', "Can view and enter patient data"),)
    
