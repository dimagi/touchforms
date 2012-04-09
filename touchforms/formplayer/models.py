from __future__ import absolute_import
from django.db import models
from django.conf import settings
from django.core.files import File
from datetime import datetime
from xml.etree import ElementTree
import re
import os
import logging
import hashlib
from couchdbkit.schema.properties import StringProperty, IntegerProperty, DictProperty
from couchdbkit.ext.django.schema import Document
from couchdbkit.resource import ResourceNotFound

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
    checksum = models.CharField(help_text='Attachment SHA-1 Checksum',
                                max_length=40, blank=True)
    file = models.FileField(upload_to="xforms", max_length=255)
    uuid = models.CharField(max_length=32, default=u'')
    
    def __unicode__(self):
        return "%s (%s)" % (self.name, self.namespace)
    
    class Meta:
        app_label = 'formplayer'

    @classmethod
    def from_file_with_uuid(cls, filename, uuid):
        try:
            xform = XForm.objects.get(uuid=uuid)
        except XForm.DoesNotExist:
            xform = XForm.from_file(filename)
            xform.uuid = uuid
            xform.save()
        return xform

    @classmethod
    def from_file(cls, filename, name=None):
        """Create an xform from the original xml/xhtml file"""
        f = File(open(filename, 'r'))
        try:
            if name is None:
                name = os.path.basename(f.name)
            file_contents = f.read()
            checksum = hashlib.sha1(file_contents).hexdigest()
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
                                            checksum=checksum, file=f)
            return instance
        finally:
            f.close()
                        
class PlaySession(Document):
    xform_id = IntegerProperty()
    next = StringProperty()
    abort = StringProperty()
    preloader_data = DictProperty()
    saved_instance = StringProperty()
    input_mode = StringProperty()
    
    def get_instance(self):
        return self.fetch_attachment("form.xml")
        
    
