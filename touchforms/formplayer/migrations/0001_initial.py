# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'XForm'
        db.create_table('formplayer_xform', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.utcnow)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('namespace', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('version', self.gf('django.db.models.fields.IntegerField')(null=True)),
            ('uiversion', self.gf('django.db.models.fields.IntegerField')(null=True)),
            ('checksum', self.gf('django.db.models.fields.CharField')(max_length=40, blank=True)),
            ('file', self.gf('django.db.models.fields.files.FileField')(max_length=255)),
        ))
        db.send_create_signal('formplayer', ['XForm'])


    def backwards(self, orm):
        
        # Deleting model 'XForm'
        db.delete_table('formplayer_xform')


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
            'version': ('django.db.models.fields.IntegerField', [], {'null': 'True'})
        }
    }

    complete_apps = ['formplayer']
