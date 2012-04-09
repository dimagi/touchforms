from django.conf.urls.defaults import *
from touchforms.formplayer.models import XForm
from django.views.generic import list_detail

xform_info = {
    "queryset" : XForm.objects.order_by('namespace'),
}

urlpatterns = patterns('',
    url(r'^$', 'touchforms.formplayer.views.xform_list', name="xform_list"),
    url(r'^enter/(?P<xform_uuid>.*)$', 'touchforms.formplayer.views.enter_form', name='xform_play'),
    url(r'^enterkb/(?P<xform_uuid>.*)$', 'touchforms.formplayer.views.enter_form', {'input_mode': 'type'}, name='xform_play_kb'),
    url(r'^enterall/(?P<xform_uuid>.*)$', 'touchforms.formplayer.views.enter_form', {'input_mode': 'full'}, name='xform_play_all'),
    url(r'^play_remote/$', 'touchforms.formplayer.views.play_remote', name='xform_play_remote'),    
    url(r'^play_remote/(?P<session_id>\w*)/$', 'touchforms.formplayer.views.play_remote', name='xform_play_remote'),
    url(r'^instance/(?P<session_id>\w*)/$', 'touchforms.formplayer.views.get_remote_instance', name='get_remote_instance'),
    url(r'^download/(?P<xform_uuid>.*)$', 'touchforms.formplayer.views.download', name='xform_download'),
    url(r'^player_proxy$', 'touchforms.formplayer.views.player_proxy', name='xform_player_proxy'),
    url(r'^api/preload/$', 'touchforms.formplayer.views.api_preload_provider', name='xform_preloader'),
    url(r'^api/autocomplete/$', 'touchforms.formplayer.views.api_autocomplete', name='touchforms_autocomplete'),
    url(r'^player-abort/$', 'touchforms.formplayer.views.player_abort', name='touchforms_force_abort'),    
)
