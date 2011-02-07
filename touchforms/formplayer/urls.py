from django.conf.urls.defaults import *
from formplayer.models import XForm
from django.views.generic import list_detail

xform_info = {
    "queryset" : XForm.objects.order_by('namespace'),
}

urlpatterns = patterns('',
    url(r'^$', 'formplayer.views.xform_list', name="xform_list"),
    url(r'^enter/(?P<xform_id>.*)$', 'formplayer.views.play', name='xform_play'),
    url(r'^play_remote/$', 'formplayer.views.play_remote', name='xform_play_remote'),    
    url(r'^play_remote/(?P<session_id>\w*)/$', 'formplayer.views.play_remote', name='xform_play_remote'),
    url(r'^download/(?P<xform_id>.*)$', 'formplayer.views.download', name='xform_download'),
    url(r'^player_proxy$', 'formplayer.views.player_proxy', name='xform_player_proxy'),
    url(r'^api/preload/$', 'formplayer.views.api_preload_provider', name='xform_preloader'),
    url(r'^api/autocomplete/$', 'formplayer.views.api_autocomplete', name='touchforms_autocomplete'),
    url(r'^player-abort/$', 'formplayer.views.player_abort', name='touchforms_force_abort'),    
)
