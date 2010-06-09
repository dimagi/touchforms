from __future__ import absolute_import

import datetime
from django.conf import settings
from couchdbkit.ext.django.schema import *
import bhoma.apps.xforms.const as const

"""
Couch models.  For now, we prefix them starting with C in order to 
differentiate them from their (to be removed) django counterparts.
"""

class CXFormInstance(Document):
    """An XForms instance."""
    
    @property
    def type(self):
        return self.all_properties().get(const.TAG_TYPE, "")
        
    @property
    def version(self):
        return self.all_properties().get(const.TAG_VERSION, "")
        
    @property
    def uiversion(self):
        return self.all_properties().get(const.TAG_UIVERSION, "")
    
    @property
    def namespace(self):
        return self.all_properties().get(const.TAG_NAMESPACE, "")
    
    class Meta:
        app_label = 'xforms'
    
    def __unicode__(self):
        return "%s (%s)" % (self.type, self.namespace)
