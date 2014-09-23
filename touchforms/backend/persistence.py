from __future__ import with_statement
import tempfile
import os
from xcp import TouchFormsException
import settings
from com.xhaus.jyson import JSONDecodeError
import com.xhaus.jyson.JysonCodec as json

class EmptyCacheFileException(TouchFormsException):
    pass

def persist(sess):
    sess_id = sess.uuid
    state = sess.session_state()
    timeout = sess.staleness_window
    cache_set(sess_id, state, timeout)

def restore(sess_id, factory):
    try:
        state = cache_get(sess_id)
    except KeyError:
        return None

    state['uuid'] = sess_id
    return factory(**state)

# TODO integrate with real caching framework (django ideally)
def cache_set(key, value, timeout):
    with open(cache_path(key), 'w') as f:
        f.write(json.dumps(value).encode('utf8'))

# TODO integrate with real caching framework (django ideally)
def cache_get(key):
    try:
        with open(cache_path(key)) as f:
            return json.loads(f.read().decode('utf8'))
    except IOError:
        raise KeyError
    except JSONDecodeError:
        raise EmptyCacheFileException


def cache_del(key):
    raise RuntimeError('not implemented')

def cache_path(key):
    # todo: make this use something other than the filesystem
    persistence_dir = settings.PERSISTENCE_DIRECTORY or tempfile.gettempdir()
    if not os.path.exists(persistence_dir):
        os.makedirs(persistence_dir)
    return os.path.join(persistence_dir, 'tfsess-%s' % key)
