#!/usr/bin/env python
# vim: ai ts=4 sts=4 et sw=4

from django.conf import settings 
from django.views.decorators.http import require_GET
from django.contrib.auth.views import login as django_login
from django.contrib.auth.views import logout as django_logout
from bhoma.utils import render_to_response
from django.http import HttpResponseRedirect, HttpResponseNotAllowed,\
    HttpResponseForbidden
from django.core.urlresolvers import reverse
from django.contrib.auth import authenticate, login
from django.core.context_processors import request

@require_GET
def dashboard(req):
    return HttpResponseRedirect(reverse("patient_search"))

def touchscreen_logout(req, template_name="auth/loggedout_ts.html"):
    '''Logout of bhoma'''
    return django_logout(req, **{"template_name" : template_name})


def touchscreen_login(request):
    '''Login to bhoma via touchscreen'''
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(username=username, password=password)
        if user is None:
            # HACK try lowercase
            user = authenticate(username=username, password=password.lower())
        if user is not None:
            if user.is_active:
                login(request, user)
                return HttpResponseRedirect(reverse("landing_page"))
            else:
                return HttpResponseNotAllowed("Sorry %s's account has been disabled" % username)
        else:
            return HttpResponseForbidden("Sorry that wasn't the right username or password")

    return render_to_response(request, "xforms/touchscreen.html", 
                              {'form': {'name':  'login', 
                                        'wfobj': 'wfLogin'}, 
                               'mode':  'workflow',
                               'dynamic_scripts': ["webapp/javascripts/login.js",] })

def new_user(request):
    return render_to_response(request, "xforms/touchscreen.html", 
                              {'form': {'name':  'login', 
                                        'wfobj': 'wfLogin'}, 
                               'mode':  'workflow', 
                               'dynamic_scripts': ["webapp/javascripts/user_reg.js",] })


def bhoma_login(req, template_name="auth/login.html"):
    '''Login to bhoma, regular'''
    return django_login(req, **{"template_name" : template_name})

def logout(req, template_name="auth/loggedout.html"):
    '''Logout of bhoma, regular'''
    return django_logout(req, **{"template_name" : template_name})

from api_views import *