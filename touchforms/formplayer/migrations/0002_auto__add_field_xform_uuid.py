# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding field 'XForm.uuid'
        db.add_column('formplayer_xform', 'uuid', self.gf('django.db.models.fields.CharField')(default=u'', max_length=32), keep_default=False)


    def backwards(self, orm):
        
        # Deleting field 'XForm.uuid'
        db.delete_column('formplayer_xform', 'uuid')


    models = {
        'formplayer.xform': {
            'Meta': {'object_name': 'XForm'},
            'checksum': ('django.db.models.fields.CharField', [], {'max_length': '40', 'blank': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.utcnow'}),
            'file': ('django.db.models.fields.files.FileField', [], {'max_length': '255'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'namespace': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'uiversion': ('django.db.models.fields.IntegerField', [], {'null': 'True'}),
            'uuid': ('django.db.models.fields.CharField', [], {'default': "u''", 'max_length': '32'}),
            'version': ('django.db.models.fields.IntegerField', [], {'null': 'True'})
        }
    }

    complete_apps = ['formplayer']
