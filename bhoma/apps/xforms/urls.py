from django.conf.urls.defaults import *
from bhoma.apps.xforms.models import XForm
from django.views.generic import list_detail

xform_info = {
    "queryset" : XForm.objects.all(),
}

urlpatterns = patterns('',
    url(r'^$', list_detail.object_list, xform_info, name="xform_list"),
    url(r'^enter/(?P<xform_id>.*)$', 'bhoma.apps.xforms.views.play', name='xform_play'),
    url(r'^download/(?P<xform_id>.*)$', 'bhoma.apps.xforms.views.download', name='xform_download'),
    url(r'^player_proxy$', 'bhoma.apps.xforms.views.player_proxy', name='xform_player_proxy'),
    url(r'^post/$', 'bhoma.apps.xforms.views.post', name='xform_post'),
    
)
