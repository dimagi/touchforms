from __future__ import with_statement
import tempfile
from gettext import gettext as _
import os
from xcp import EmptyCacheFileException
import settings
from com.xhaus.jyson import JSONDecodeError
import com.xhaus.jyson.JysonCodec as json
from org.mapdb import DB, DBMaker
from java.io import File
from java.lang import System


def persist(sess):
    sess_id = sess.uuid
    state = sess.session_state()
    timeout = sess.staleness_window
    cache_set(sess_id, state, timeout)


def restore(sess_id, factory, override_state=None):
    try:
        state = cache_get(sess_id)
    except KeyError:
        return None

    state['uuid'] = sess_id
    if override_state:
        state.update(override_state)
    return factory(**state)


def cache_set(key, value, timeout):
    tf_db = get_map_db()
    sess_map = tf_db.getTreeMap("touchforms-map")
    sess_map.put(key, value)
    tf_db.commit()


def cache_get(key):
    tf_db = get_map_db()
    sess_map = tf_db.getTreeMap("touchforms-map")
    return sess_map.get(key)


def cache_del(key):
    tf_db = get_map_db()
    sess_map = tf_db.getTreeMap("touchforms-map")
    sess_map.remove(key)


def get_map_db():
    temp_file = (settings.PERSISTENCE_DIRECTORY or tempfile.gettempdir()) + "/tf-map-db"
    f = File(temp_file)
    if not f.exists():
        f = File(temp_file)
    db = DBMaker.newFileDB(f).closeOnJvmShutdown().make()
    return db
