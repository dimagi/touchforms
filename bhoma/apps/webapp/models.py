from django.db import models
from bhoma.apps.webapp.permissions import BHOMA_PERMISSIONS

class Permissions(models.Model):
    """
    Stub class to hold permissions.
    """
       
    class Meta():
        permissions = BHOMA_PERMISSIONS
    
class Ping(models.Model):
    at = models.DateTimeField(auto_now_add=True)
    ip = models.CharField(max_length=20)
    tag = models.CharField(max_length=50)
    payload = models.TextField(null=True, blank=True)
