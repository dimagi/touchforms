================
 A django-based web XForms Player for touchscreens
================

Prerequisites
=============
Python (2.6+ recommended)
Django (1.2+ recommended)
Java (1.5+ recommended)
Jython (2.5+ recommended)


Getting started
=============
Get the prerequisites.
Get the code.

Syncdb::
    python manage.py syncdb
    
Run the backend::
    cd backend
    jython xformserver.py 444

Run the django frontend::
    python manage.py runserver
    
Play forms!