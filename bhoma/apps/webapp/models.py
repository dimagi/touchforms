from django.db.models import Model

from bhoma.apps.webapp.permissions import BHOMA_PERMISSIONS

class Permissions(Model):
    """
    Stub class to hold permissions.
    """
       
    class Meta():
        permissions = BHOMA_PERMISSIONS
    
