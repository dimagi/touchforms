from __future__ import with_statement

import urllib2
import settings
import logging
import com.xhaus.jyson.JysonCodec as json

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
        f.write(json.dumps(value))

# TODO integrate with real caching framework (django ideally)
def cache_get(key):
    try:
        with open(cache_path(key)) as f:
            return json.loads(f.read())
    except IOError:
        raise KeyError

def cache_del(key):
    raise RuntimeError('not implemented')

# for debugging
def cache_path(key):
    return '/tmp/tfsess-%s' % key
