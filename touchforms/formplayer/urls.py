from django.conf.urls import *
from touchforms.formplayer.models import XForm
from touchforms.formplayer.views import (
    xform_list,
    enter_form,
    download,
    player_proxy,
    api_preload_provider,
    api_autocomplete,
    player_abort,
)

xform_info = {
    "queryset" : XForm.objects.order_by('namespace'),
}

urlpatterns = patterns('',
    url(r'^$', xform_list, name="xform_list"),
    url(r'^enter/(?P<xform_id>.*)$', enter_form, name='xform_play'),
    url(r'^enterkb/(?P<xform_id>.*)$', enter_form, {'input_mode': 'type'}, name='xform_play_kb'),
    url(r'^enterall/(?P<xform_id>.*)$', enter_form, {'input_mode': 'full'}, name='xform_play_all'),
    url(r'^enteroffline/(?P<xform_id>.*)$', enter_form,
        {'input_mode': 'full', 'offline': True}, name='xform_play_offline'),
    url(r'^download/(?P<xform_id>.*)$', download, name='xform_download'),
    url(r'^player_proxy$', player_proxy, name='xform_player_proxy'),
    url(r'^api/preload/$', api_preload_provider, name='xform_preloader'),
    url(r'^api/autocomplete/$', api_autocomplete, name='touchforms_autocomplete'),
    url(r'^player-abort/$', player_abort, name='touchforms_force_abort'),
)
