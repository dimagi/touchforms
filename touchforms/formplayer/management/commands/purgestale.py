from django.core.management.base import BaseCommand
import urllib2
import json


class Command(BaseCommand):
    help = 'enter age as suitable for timedelta(), e.g., minutes=30'

    def add_arguments(self, parser):
        parser.add_argument(
            'stale_threshold_age',
            dest='timespec',
        )
        parser.add_argument(
            '-s',
            dest='server_url',
            help='url of formplayer server',
            default='127.0.0.1:4444/',
        )

    def handle(self, timespec, **options):
        server = options['server_url']
        if not server.startswith('http://') and not server.startswith('https://'):
            server = 'http://' + server

        window = eval('timedelta(%s)' % timespec)
        payload = {'action': 'purge-stale', 'window': sdelt(window)}

        print 'purging sessions on %s older than %ds' % (server, payload['window'])

        resp = urllib2.urlopen(server, json.dumps(payload))
        print resp.read()


def sdelt(delta):
    return 86400. * delta.days + delta.seconds + 1.0e-6 * delta.microseconds
