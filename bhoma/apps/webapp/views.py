#!/usr/bin/env python
# vim: ai ts=4 sts=4 et sw=4


from django.views.decorators.http import require_GET
from django.contrib.auth.views import login as django_login
from django.contrib.auth.views import logout as django_logout
from bhoma.utils import render_to_response
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse

@require_GET
def dashboard(req):
    return HttpResponseRedirect(reverse("patient_search"))

def login(req, template_name="auth/login.html"):
    '''Login to rapidsms'''
    return django_login(req, **{"template_name" : template_name})

def logout(req, template_name="auth/loggedout.html"):
    '''Logout of rapidsms'''
    return django_logout(req, **{"template_name" : template_name})
