from django.db import models
from django.conf import settings
from django.core.files import File
from datetime import datetime
from bhoma.apps.djangoplus.fields import PickledObjectField
from xml.etree import ElementTree
import re
import os

VERSION_KEY = "version"
UIVERSION_KEY = "uiVersion" 

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
    
    @classmethod
    def from_file(cls, filename, name=None):
        """Create an xform from the original xml/xhtml file"""
        f = File(open(filename, 'r'))
        if name is None:
            name = os.path.basename(f.name)
        file_contents = f.read()
        
        # TODO: parsing is exremely brittle and we should use jad/jar javarosa 
        # stuff for it
        element = ElementTree.XML(file_contents)
        head = element[0]
        namespace, version, uiversion = [None,] * 3
        for child in head:
            if "model" in child.tag:
                for subchild in child:
                    if "instance" in subchild.tag:
                        instance_root = subchild[0]
                        r = re.search('{[a-zA-Z0-9_\-\.\/\:]*}', instance_root.tag)
                        if r is None:
                            raise Exception("No namespace found in xform: %s" % name)
                        for key, value in instance_root.attrib.items():
                            # we do case-sensitive comparison because that's the 
                            # xml spec.  we may want to make this less academic
                            # and more user friendly.
                            if key.strip() == VERSION_KEY:
                                version = int(value)
                            elif key.strip() == UIVERSION_KEY:
                                uiversion = int(value)
                            
                        namespace = r.group(0).strip('{').strip('}')
        if not namespace:
            raise Exception("No namespace found in xform: %s" % name)
        
        if not namespace:
            raise Exception("No namespace found in xform: %s" % name)
        
        instance = XForm.objects.create(name=name, namespace=namespace, 
                                        version=version, uiversion=uiversion,
                                        file=f)           
        return instance
                        
# I think we want some notion of signals against XForms.  Not sure 
# how this should work.

class XFormCallback(models.Model):
    
    xform = models.ForeignKey(XForm)
    callback = models.CharField(max_length=255, 
                                help_text="Name of Python callback function")
    # should be a pickled set
    callback_args = PickledObjectField(null=True, blank=True)
    # should be a pickled dictionary
    callback_kwargs = PickledObjectField(null=True, blank=True)
    