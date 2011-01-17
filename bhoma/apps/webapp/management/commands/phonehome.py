from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import urllib2
from bhoma.apps.locations.models import Location
from bhoma.utils.couch.database import get_db
import logging
import json
from datetime import datetime, timedelta
import os
import os.path
import re

#move to settings? make more generic?
DEFAULT_IFACE = 'ppp0'
#DEFAULT_IFACE = 'eth0'
#DEFAULT_IFACE = 'wlan0'

def status_report(name, interval=None):
    def _status_report(f):
        def __status_report(self, payload, *args, **kwargs):
            last = get_last_exec(name) if interval else None
            if due(last, interval):
                payload[name] = f(self, *args, **kwargs)
                update_last_exec(name)
        return __status_report
    return _status_report

class Command(BaseCommand):

    def handle(self, *args, **options):
        self.SERVER = settings.BHOMA_NATIONAL_SERVER_ROOT.split(':')[0] #hack to remove port
        #self.SERVER = '127.0.0.1:8000'
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
                self.net_status_simple(payload)

            except Exception, e:
                logging.exception('error generating payload')
                payload = {'error': '%s: %s' % (type(e), str(e))}

            return json.dumps(payload)
        except:
            logging.exception('failsafe error generating payload')
            return 'error!'

    @status_report('couch', 90)
    def couch_status(self):
        db = get_db()
        return {'info': db.info()}

    @status_report('net')
    def net_status_simple(self, iface=DEFAULT_IFACE):
        with os.popen('/sbin/ifconfig') as f:
            lines = f.readlines()

        current_iface = None
        tx = None
        rx = None
        iffound = False
        for l in lines:
            match = re.match('(?P<iface>\w+)\s+', l)
            if match:
                current_iface = match.group('iface')
            if current_iface == iface:
                iffound = True
                rxmatch = re.search('RX\s+bytes:?\s*(?P<c>\d+)', l)
                txmatch = re.search('TX\s+bytes:?\s*(?P<c>\d+)', l)
                if rxmatch:
                    rx = int(rxmatch.group('c'))
                if txmatch:
                    tx = int(txmatch.group('c'))

        if (tx == None or rx == None) and iffound:
            logging.debug('unable to get tx/rx data [%s] [%s]' % (iface, str(lines)))

        return {'rx': rx, 'tx': tx}

def due(last, interval):
    now = datetime.utcnow()
    return (
        last == None or
        not interval or
        now < last or
        now > last + timedelta(minutes=interval)
    )

def tmp_file_path(name):
    return os.path.join(settings.BHOMA_TMP_DIR, 'last_%s_status_report' % name)

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
