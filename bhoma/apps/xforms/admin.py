from django.contrib import admin
from bhoma.apps.xforms.models import XForm, XFormCallback

admin.site.register(XForm)
admin.site.register(XFormCallback)
