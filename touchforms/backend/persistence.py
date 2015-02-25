from __future__ import with_statement
import tempfile
from gettext import gettext as _
import os
from xcp import EmptyCacheFileException
import settings
from com.xhaus.jyson import JSONDecodeError
import com.xhaus.jyson.JysonCodec as json
from java.sql import DriverManager, PreparedStatement, Connection, ResultSet, SQLException
from java.lang import Class
from com.ziclix.python.sql import zxJDBC
from org.postgresql import Driver
from org.python.core import Py
import sys
import util
import classPathHacker


def persist(sess):
    sess_id = sess.uuid
    state = sess.session_state()
    timeout = sess.staleness_window
    cache_set(sess_id, state, timeout)


def restore(sess_id, factory, override_state=None):
    try:
        state = cache_get(sess_id)
        print "final state: " + str(state)
    except KeyError:
        return None

    state['uuid'] = sess_id
    if override_state:
        state.update(override_state)
    return factory(**state)


def cache_set(key, value, timeout):
    if key is None:
        raise KeyError
    perform_insert(key, value)


def cache_get(key):
    if key is None:
        raise KeyError
    return perform_lookup(key)


def cache_del(key):
    print "derp"


def perform_lookup(key):
    conn = get_conn()
    cursor = conn.cursor()
    query = "SELECT sess_json FROM sessions7 WHERE sess_id='" + key + "'"
    cursor.execute(query)
    row = cursor.fetchone()
    value = row[0]
    conn.close()
    jsonobj = json.loads(value.getValue()[1:-1].decode('utf8'))
    return jsonobj


def perform_insert(key, value):
    conn = get_conn()
    cursor = conn.cursor()
    delete_query = "DELETE FROM sessions7 WHERE sess_id='" + key + "'"
    insert_query = "INSERT INTO sessions7 (sess_id, sess_json) VALUES ('" + key + "', $$[" + json.dumps(value).encode('utf8') + "]$$)"
    cursor.execute(delete_query)
    cursor.execute(insert_query)
    conn.commit()
    conn.close()


def get_conn():
    jdbc_url = "jdbc:postgresql:touchform_sessions"
    username = "wpride1"
    password = "123"
    driver = "org.postgresql.Driver"

    try:
        # if called from command line with .login CLASSPATH setup right,this works
        conn = zxJDBC.connect(jdbc_url, username, password, driver)
    except:
        # if called from Apache or account where the .login has not set CLASSPATH
        # need to use run-time CLASSPATH Hacker
        jarLoad = classPathHacker.classPathHacker()
        a = jarLoad.addFile("/Users/wpride1/commcare-hq/submodules/touchforms-src/touchforms/backend/jrlib/postgresql-9.4-1200.jdbc4.jar")
        conn = zxJDBC.connect(jdbc_url, username, password, driver)

    return conn