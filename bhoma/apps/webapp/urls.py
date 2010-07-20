#!/usr/bin/env python
# vim: ai ts=4 sts=4 et sw=4

from django.conf.urls.defaults import *
from . import views
from django.views.generic.simple import direct_to_template
from django.contrib.auth.decorators import login_required

urlpatterns = patterns('',
    url(r'^$', login_required(direct_to_template), {"template": "landing_page.html"}, name="landing_page"),
    url(r'^accounts/login_ts/$', views.touchscreen_login),
    url(r'^accounts/login/$', views.bhoma_login),
    url(r'^accounts/logout/$', views.logout),
    
    url(r'^api/auth/$', views.authenticate_user),
    
)
