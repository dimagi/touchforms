from django.conf.urls.defaults import *
from touchforms.formplayer.models import XForm
from django.views.generic import list_detail

xform_info = {
    "queryset" : XForm.objects.order_by('namespace'),
}

urlpatterns = patterns('',
    url(r'^$', 'touchforms.formplayer.views.xform_list', name="xform_list"),
    url(r'^enter/(?P<xform_id>.*)$', 'touchforms.formplayer.views.play', name='xform_play'),
    url(r'^play_remote/$', 'touchforms.formplayer.views.play_remote', name='xform_play_remote'),    
    url(r'^play_remote/(?P<session_id>\w*)/$', 'touchforms.formplayer.views.play_remote', name='xform_play_remote'),
    url(r'^download/(?P<xform_id>.*)$', 'touchforms.formplayer.views.download', name='xform_download'),
    url(r'^player_proxy$', 'touchforms.formplayer.views.player_proxy', name='xform_player_proxy'),
    url(r'^api/preload/$', 'touchforms.formplayer.views.api_preload_provider', name='xform_preloader'),
    url(r'^api/autocomplete/$', 'touchforms.formplayer.views.api_autocomplete', name='touchforms_autocomplete'),
    url(r'^player-abort/$', 'touchforms.formplayer.views.player_abort', name='touchforms_force_abort'),    
)
