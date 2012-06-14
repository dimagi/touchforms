from django.contrib import admin
from touchforms.formplayer.models import XForm

class XFormAdmin(admin.ModelAdmin):
    list_display = ('name', 'namespace','file')

admin.site.register(XForm, XFormAdmin)
