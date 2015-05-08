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

Setting up Grunt
==================
Touchforms uses Grunt to run various tasks like compiling HTML templates for the `fullform-ui.js` to use.  First install grunt globally ::

    npm -g install grunt
    npm -g install grunt-cli

Then install all dependencies via the package.json ::

    npm install

Finally, compile the js files with ::

    grunt build

Now if you run the grunt `watch` command, grunt will make sure to update compiled versions. For example, editting anything in the `fullform-ui` directory will automatically compile a new `fullform-ui.templates.js`. ::

    grunt watch
