from django.conf.urls.defaults import *
from xformplayer.models import XForm
from django.views.generic import list_detail

xform_info = {
    "queryset" : XForm.objects.order_by('namespace'),
}

urlpatterns = patterns('',
    url(r'^$', 'xformplayer.views.xform_list', name="xform_list"),
    url(r'^enter/(?P<xform_id>.*)$', 'xformplayer.views.play', name='xform_play'),
    url(r'^play_remote/$', 'xformplayer.views.play_remote', name='xform_play_remote'),    
    url(r'^play_remote/(?P<session_id>\w*)/$', 'xformplayer.views.play_remote', name='xform_play_remote'),
    url(r'^download/(?P<xform_id>.*)$', 'xformplayer.views.download', name='xform_download'),
    url(r'^player_proxy$', 'xformplayer.views.player_proxy', name='xform_player_proxy'),
)
