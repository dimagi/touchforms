from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import urllib2
from bhoma.apps.locations.models import Location
from bhoma.utils.couch.database import get_db
import logging
import json
from datetime import datetime, timedelta
import os.path

def status_report(name, interval):
    def _status_report(f):
        def __status_report(self, payload, *args, **kwargs):
            last = get_last_exec(name)
            if due(last, interval):
                payload[name] = f(self, *args, **kwargs)
                update_last_exec(name)
        return __status_report
    return _status_report

class Command(BaseCommand):

    def handle(self, *args, **options):
        self.SERVER = settings.BHOMA_NATIONAL_SERVER_ROOT
        self.ID_TAG = settings.BHOMA_CLINIC_ID

        urllib2.urlopen(
            'http://%s/api/phonehome/%s/' % (self.SERVER, self.ID_TAG),
            self.get_payload()
        ).read()

    def is_clinic(self):
        try:
            loc = Location.objects.get(slug=self.ID_TAG)
            loc_type = loc.type.slug
            if loc_type == 'clinic':
                return True
            elif loc_type == 'district':
                return False
            else:
                raise ValueError('neither clinic nor district')
        except:
            logging.exception('id tag [%s] not a known location' % self.ID_TAG)
            return None

    def get_payload(self):
        try:
            try:
                payload = {'version': settings.BHOMA_COMMIT_ID}
                self.couch_status(payload)

            except Exception, e:
                logging.exception('error generating payload')
                payload = {'error': '%s: %s' % (type(e), str(e))}

            return json.dumps(payload)
        except:
            logging.exception('failsafe error generating payload')
            return 'error!'

    @status_report('couch', 240)
    def couch_status(self):
        db = get_db()
        return {'info': db.info()}

def due(last, interval):
    now = datetime.utcnow()
    return (
        last == None or
        now < last or
        now > last + timedelta(minutes=interval)
    )

#todo: move this to settings
LAST_EXEC_PATH = '/var/run/bhoma/'

def tmp_file_path(name):
    return os.path.join(LAST_EXEC_PATH, 'last_%s_status_report' % name)

def get_last_exec(name):
    try:
        with open(tmp_file_path(name)) as f:
            return datetime.strptime(f.read()[:19], '%Y-%m-%d %H:%M:%S')
    except:
        logging.exception('error retrieving last exec time for [%s]' % name)
        return None

def update_last_exec(name, when=None):
    if not when:
        when = datetime.utcnow()

    try:
        with open(tmp_file_path(name), 'w') as f:
            f.write('%s\n' % when.strftime('%Y-%m-%d %H:%M:%S'))
    except:
        logging.exception('error updating last exec time for [%s]' % name)
