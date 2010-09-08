from django.conf.urls.defaults import *
from bhoma.apps.xforms.models import XForm
from django.views.generic import list_detail

xform_info = {
    "queryset" : XForm.objects.order_by('namespace'),
}

urlpatterns = patterns('',
    url(r'^$', 'bhoma.apps.xforms.views.xform_list', name="xform_list"),
    url(r'^enter/(?P<xform_id>.*)$', 'bhoma.apps.xforms.views.play', name='xform_play'),
    url(r'^download/(?P<xform_id>.*)$', 'bhoma.apps.xforms.views.download', name='xform_download'),
    url(r'^download_excel/(?P<namespace>.*)$', 'bhoma.apps.xforms.views.download_excel', name='xform_download_excel'),
    url(r'^player_proxy$', 'bhoma.apps.xforms.views.player_proxy', name='xform_player_proxy'),
    url(r'^post/$', 'bhoma.apps.xforms.views.post', name='xform_post'),
    
)
