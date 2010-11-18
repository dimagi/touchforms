from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import urllib2
from bhoma.apps.locations.models import Location
import logging

class Command(BaseCommand):

    def handle(self, *args, **options):

        self.SERVER = settings.BHOMA_NATIONAL_SERVER_ROOT
        self.ID_TAG = settings.BHOMA_CLINIC_ID

        urllib2.urlopen('http://%s/api/phonehome/%s/' % (self.SERVER, self.ID_TAG), self.payload()).read()

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

    def payload(self):
        return None
