from django.conf.urls.defaults import *
from xforms.models import XForm
from django.views.generic import list_detail

xform_info = {
    "queryset" : XForm.objects.order_by('namespace'),
}

urlpatterns = patterns('',
    url(r'^$', 'xforms.views.xform_list', name="xform_list"),
    url(r'^enter/(?P<xform_id>.*)$', 'xforms.views.play', name='xform_play'),
    url(r'^download/(?P<xform_id>.*)$', 'xforms.views.download', name='xform_download'),
    url(r'^player_proxy$', 'xforms.views.player_proxy', name='xform_player_proxy'),
)
