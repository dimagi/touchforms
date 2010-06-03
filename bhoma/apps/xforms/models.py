from django.db import models
from django.conf import settings
from datetime import datetime
from bhoma.apps.djangoplus.fields import PickledObjectField

class XForm(models.Model):
    """A record of an XForm"""
    
    # NOTE: this is a somewhat static list for BHOMA.  It may not be
    # worth all the overhead to keep this flexible in this model.
    
    # NOTE: should these be in couch?
    created = models.DateTimeField(default=datetime.utcnow)
    name = models.CharField(max_length=255)
    namespace = models.CharField(max_length=255)
    version = models.IntegerField(null=True)
    uiversion = models.IntegerField(null=True)
    file = models.FileField(upload_to="xforms", max_length=255)
    
    def __unicode__(self):
        return "%s (%s)" % (self.name, self.namespace)

# I think we want some notion of signals against XForms.  Not sure 
# how this should work.

class XFormCallback(models.Model):
    
    callback_args = PickledObjectField(null=True, blank=True)
    # should be a pickled dictionary
    callback_kwargs = PickledObjectField(null=True, blank=True)
    