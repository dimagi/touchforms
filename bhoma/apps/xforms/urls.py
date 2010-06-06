from django.conf.urls.defaults import *
from bhoma.apps.xforms.models import XForm
from django.views.generic import list_detail

xform_info = {
    "queryset" : XForm.objects.all(),
}

urlpatterns = patterns('',
    (r'^$', list_detail.object_list, xform_info),
    url(r'^enter/(?P<xform_id>.*)$', 'bhoma.apps.xforms.views.play', name='xform_play'),
)
