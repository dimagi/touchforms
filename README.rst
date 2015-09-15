================
 A django-based web XForms Player for touchscreens
================
.. image:: https://travis-ci.org/dimagi/touchforms.svg?branch=master
   :target: https://travis-ci.org/dimagi/touchforms
 
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


Information passing
=======

There are multiple calls that touchforms makes to CommCare HQ. Here is a summary of how they work.

===================  ========================================  ===========================================================
Call                 URL                                       Auth
===================  ========================================  ===========================================================
Get XForm            `get_url_base()` / settings.BASE_ADDRESS  None required
Load case data       `touchforms.localsettings.URL_ROOT`       Session (cloudcare) or `settings.TOUCHFORMS_API_USER` (sms)
Load fixture data    `touchforms.localsettings.URL_ROOT`       Session (cloudcare) or `settings.TOUCHFORMS_API_USER` (sms)
Load ledger data     `touchforms.localsettings.URL_ROOT`       Session (cloudcare) or `settings.TOUCHFORMS_API_USER` (sms)
===================  ========================================  ===========================================================

Offline Cloudcare
=================

To build::

    cd offline/
    python build.py url-root

url-root is the url you will download the java webstart package from.
for example, if i download from http://commcarehq.org/offline-cloudcare/offline-cloudcare.jnlp, url-root is http://commcarehq.org/offline-cloudcare/

the packaged result will be in dist/standalone (one jar) or dist/split (many jars). deploy the folder contents as-is to url-root

Running Tests
=============

To run the backend tests you can just run the following ::

     jython backend/test_server.py && jython backend/test_xformplayer.py && jython backend/test_touchcare.py && jython backend/test_global_state_manager.py

To run tests you need to have Jython and `PhantomJS <http://phantomjs.org/>`_ installed.
On linux PhantomJS needss to be installed from source.
Then run the following commands ::

    pip install -r touchforms/test_requirements.txt
    ./run_tests.sh
