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

        stream = ('-' in args)
        if stream:
            outpath = 'stdout'
            fout = sys.stdout
        else:
            outpath = OUTFILE % {'timestamp': datetime.now().strftime('%Y%m%d%H%M%S')}
            fout = open(outpath, 'w')

        incl_deleted = ('x' in args)

        docids = set()
        rows = db.get('_all_docs')['rows']
        for doc in rows:
            docid = doc['id']
            if docid.startswith('_design'):
                continue
            rev = doc['value']['rev']

            docids.add(docid)
            fout.write(hashify(docid, DOCID_HASH_LEN))
            fout.write(hashify(rev, REV_HASH_LEN))

        deleted_docs = set()
        if incl_deleted:
            rows = db.get('_changes')['results']
            for tx in rows:
                docid = tx['id']
                if docid.startswith('_design'):
                    continue
                if not ('deleted' in tx and tx['deleted']):
                    continue
                if docid in docids:
                    continue

                docids.add(docid)
                deleted_docs.add(docid)
                fout.write(hashify(docid, DOCID_HASH_LEN))
                fout.write('\xff' * REV_HASH_LEN)

        sys.stderr.write('dump written to %s; %d records%s; %.1fKB\n' % \
            (outpath, len(docids), ' (%d deleted)' % len(deleted_docs) if incl_deleted else '', (DOCID_HASH_LEN + REV_HASH_LEN) * len(docids) / 1024.))

def hashify(data, hashlen):
    return hashlib.sha1(data).digest()[:hashlen]
