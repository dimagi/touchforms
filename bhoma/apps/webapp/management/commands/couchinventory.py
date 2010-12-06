from django.core.management.base import BaseCommand, CommandError
from bhoma.utils.couch.database import get_db
import hashlib
import sys
from datetime import datetime

DOCID_HASH_LEN = 7 #bytes; only .0007% chance of collision with 1e6 distinct documents
REV_HASH_LEN = 2 #bytes; .5% chance of collision with 25 distinct versions for a given document
OUTFILE = '/tmp/couchdump.%(timestamp)s.bin'

class Command(BaseCommand):

    def handle(self, *args, **options):
        db = get_db()

        stream = (len(args) > 0 and args[-1] == '-')
        if stream:
            outpath = 'stdout'
            fout = sys.stdout
        else:
            outpath = OUTFILE % {'timestamp': datetime.now().strftime('%Y%m%d%H%M%S')}
            fout = open(outpath, 'w')

        rows = db.get('_all_docs')['rows']

        for doc in rows:
            docid = doc['id']
            if docid.startswith('_design'):
                continue
            rev = doc['value']['rev']

            fout.write(hashify(docid, DOCID_HASH_LEN))
            fout.write(hashify(rev, REV_HASH_LEN))

        sys.stderr.write('dump written to %s; %d records; %.1fKB\n' % \
            (outpath, len(rows), (DOCID_HASH_LEN + REV_HASH_LEN) * len(rows) / 1024.))

def hashify(data, hashlen):
    return hashlib.sha1(data).digest()[:hashlen]
