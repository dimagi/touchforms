================
 A django-based web XForms Player for touchscreens
================

Prerequisites
=============
Python (2.6+ recommended)
Django (1.2+ recommended)
Java (1.5+ recommended)
Jython (2.5+ required)

for building offline cloudcare:
maven2
jinja2

Getting started
=============
Get the prerequisites.
Get the code.

Update your settings.py::

    Add "touchforms.formplayer" to your INSTALLED_APPS
    Add XFORMS_PLAYER_URL = "http://127.0.0.1:4444"

Syncdb::
    python manage.py syncdb

Set localsettings.py for this backend::
    add URL_ROOT = "http://your.commcarehq/a/{{DOMAIN}}"

Run the backend::
    cd backend
    jython xformserver.py 4444

Run the django frontend::
    python manage.py runserver
    
Play forms!

Offline Cloudcare
=================

To build:

    cd offline/
    python build.py url-root

url-root is the url you will download the java webstart package from.
for example, if i download from http://commcarehq.org/offline-cloudcare/offline-cloudcare.jnlp, url-root is http://commcarehq.org/offline-cloudcare/

the packaged result will be in dist/standalone (one jar) or dist/split (many jars). deploy the folder contents as-is to url-root
