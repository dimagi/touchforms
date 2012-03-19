================
 A django-based web XForms Player for touchscreens
================

Prerequisites
=============
Python (2.6+ recommended)
Django (1.2+ recommended)
Java (1.5+ recommended)
Jython (2.5+ required)


Getting started
=============
Get the prerequisites.
Get the code.

Update your settings.py::

    Add "touchforms.formplayer" to your INSTALLED_APPS
    Add XFORMS_PLAYER_URL = "http://127.0.0.1:4444"

Syncdb::
    python manage.py syncdb
    
Run the backend::
    cd backend
    jython xformserver.py 4444

Run the django frontend::
    python manage.py runserver
    
Play forms!