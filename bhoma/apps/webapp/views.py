#!/usr/bin/env python
# vim: ai ts=4 sts=4 et sw=4

from datetime import datetime
from django.conf import settings 
from django.views.decorators.http import require_GET
from django.contrib.auth.views import login as django_login
from django.contrib.auth.views import logout as django_logout
from bhoma.utils import render_to_response
from django.http import HttpResponseRedirect, HttpResponseNotAllowed,\
    HttpResponseForbidden
from django.core.urlresolvers import reverse
from django.contrib.auth import authenticate, login
from bhoma.apps.webapp.touchscreen.options import TouchscreenOptions
from django.contrib.auth.models import User
from bhoma.utils.parsing import string_to_boolean
import logging
from django.contrib.auth.decorators import permission_required
from bhoma.apps.webapp.config import is_clinic


@require_GET
def clinic_landing_page(req):
    return render_to_response(req, "clinic_landing_page.html",
                              {"options": TouchscreenOptions.default()})

@require_GET
def landing_page(req):
    def manager_view(req):
        return render_to_response(req, "national_landing_page.html",
                                  {"options": TouchscreenOptions.default()})
    if is_clinic():
        return clinic_landing_page(req)
    else:
        return manager_view(req)
    
@require_GET
def dashboard(req):
    return HttpResponseRedirect(reverse("patient_search"))


@permission_required("webapp.bhoma_administer_clinic")
def new_user(request):
    if request.method == "POST":

        data = json.loads(request.POST.get('result'))
        if not data:
            return HttpResponseRedirect(reverse('bhoma_admin'))

        user = User()
        # HACK: all usernames and passwords are lowercased going into the db
        user.username = data.get("username").lower()
        user.set_password(data.get("password").lower())
        user.first_name = data.get("fname")
        user.last_name  = data.get("lname")
        user.email = ""
        user.is_staff = False # Can't log in to admin site
        user.is_active = True # Activated upon receipt of confirmation
        user.is_superuser = False # Certainly not
        user.last_login =  datetime(1970,1,1)
        user.date_joined = datetime.utcnow()
        user.save()
        # have to have an object before you're allowed to edit M2M fields
        # so do groups/roles last
        role = data.get("role")
        if role:
            try:
                user.groups = [Group.objects.get(name=role)]
            except Group.DoesNotExist:
                logging.error("Unable to give role %s to %s -- permissions may " 
                              "not work.  Did you forget to run syncdb recently?")
        return render_to_response(request, "auth/user_reg_complete.html", 
                                  {"new_user": user,
                                   "options": TouchscreenOptions.admin() }) 
                                  
    return render_to_response(request, "xforms/touchscreen.html", 
                              {'form': {'name':  'add user', 
                                        'wfobj': 'wfNewUser'}, 
                               'mode':  'workflow', 
                               'dynamic_scripts': ["webapp/javascripts/user_reg.js",] })

@permission_required("webapp.bhoma_administer_clinic")
def delete_user(request):
    if request.method == "POST":

        data = json.loads(request.POST.get('result'))
        if not data:
            return HttpResponseRedirect(reverse('bhoma_admin'))

        if string_to_boolean(data.get("confirm")):
            user = User.objects.get(username=data.get("username"))
            if request.user == user:
                return render_to_response(request, "touchscreen/error.html", 
                    {"error_text": "You can't delete the currently logged in user account. "
                     "Please logout and log in as a different user",
                     "options": TouchscreenOptions.admin()})
            else:
                user.delete()
        return HttpResponseRedirect(reverse("bhoma_admin"))
                                  
    return render_to_response(request, "xforms/touchscreen.html", 
                              {'form': {'name':  'delete user', 
                                        'wfobj': 'wfDeleteUser'}, 
                               'mode':  'workflow', 
                               'dynamic_scripts': ["webapp/javascripts/user_del.js",] })


def touchscreen_login(request):
    '''Login to bhoma via touchscreen'''
    if request.method == "POST":
        data = json.loads(request.POST.get('result'))
        if not data:
            return HttpResponseRedirect('/')  #TODO: where should this go? some sort of 'welcome' screen?

        username = data.get("username")
        password = data.get("password")
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


def touchscreen_logout(req, template_name="auth/loggedout_ts.html"):
    '''Logout of bhoma'''
    return django_logout(req, **{"template_name" : template_name})


def bhoma_login(req, template_name="auth/login.html"):
    '''Login to bhoma, regular'''
    if is_clinic():
        return touchscreen_login(req)
    else:
        return django_login(req, **{"template_name" : template_name})
    
def logout(req, template_name="auth/loggedout.html"):
    '''Logout of bhoma, regular'''
    if is_clinic():
        return touchscreen_login(req)
    return django_logout(req, **{"template_name" : template_name})

from api_views import *
