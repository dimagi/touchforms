#!/usr/bin/env python
# vim: ai ts=4 sts=4 et sw=4

from django.conf.urls.defaults import *
from . import views
from django.views.generic.simple import direct_to_template
from bhoma.apps.webapp.touchscreen.options import TouchscreenOptions
from django.contrib.auth.decorators import permission_required


urlpatterns = patterns('',
    url(r'^$', views.landing_page, name="landing_page"),
    url(r'^clinic/$', views.clinic_landing_page, name="clinic_landing_page"),
    
    url(r'^accounts/login_ts/$', views.touchscreen_login, name="touchscreen_login"),
    url(r'^accounts/logout_ts/$', views.touchscreen_logout, name="touchscreen_logout"),
    url(r'^accounts/login/$', views.bhoma_login, name="login"),
    url(r'^accounts/logout/$', views.logout, name="logout"),
    url(r'^bhoma/admin$',
        direct_to_template, 
        {"template": "admin.html",
         "extra_context": {"options": TouchscreenOptions.default() }},
         name="bhoma_admin"),
    url(r'^accounts/new/$', views.new_user, name="new_user"),
    url(r'^accounts/delete/$', views.delete_user, name="delete_user"),
    
    url(r'^touchscreen-abort/', views.timeout, name="touchscreen_timeout"),
        
    url(r'^api/auth/$', views.authenticate_user),
    url(r'^api/usernames/$', views.get_usernames),
    url(r'^api/roles/$', views.get_roles),
    url(r'^api/user_exists/$', views.user_exists),
    url(r'^api/autocomplete/$', views.autocomplete),
    
    url(r'^api/diagnostics/$', views.diagnostics),
    url(r'^api/phonehome/(?P<tag>\w+)/$', views.phone_home),
    
    
)
