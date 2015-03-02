from __future__ import with_statement
import settings
import tempfile
from com.xhaus.jyson import JSONDecodeError
from xcp import EmptyCacheFileException
import com.xhaus.jyson.JysonCodec as json
from com.ziclix.python.sql import zxJDBC
import classPathHacker
import os
import xformplayer


def persist(sess):
    sess_id = sess.uuid
    state = sess.session_state()
    cache_set(sess_id, state)


def restore(sess_id, factory, override_state=None):
    try:
        state = cache_get(sess_id)
    except KeyError:
        return None

    state['uuid'] = sess_id
    if override_state:
        state.update(override_state)
    return factory(**state)


def cache_set(key, value):
    if key is None:
        raise KeyError
    postgres_insert(key, value)


def cache_get(key):
    if key is None:
        raise KeyError
    try:
        return postgres_lookup(key)
    except KeyError:
        return cache_get_old(key)


def cache_del(key):
    conn = get_conn()
    cursor = conn.cursor()
    postgres_delete(cursor, key)
    conn.commit()
    conn.close()


def postgres_select(cursor, key):
    sel_sql = replace_table("SELECT * FROM %(kwarg)s WHERE sess_id=?")
    sel_params = [str(key)]
    cursor.execute(sel_sql, sel_params)


def postgres_delete(cursor, key):
    postgres_select(cursor, key)
    if cursor.rowcount is not 0:
        del_sql = replace_table("DELETE FROM %(kwarg)s WHERE sess_id=?")
        del_params = [str(key)]
        cursor.execute(del_sql, del_params)


def postgres_lookup(key):
    conn = get_conn()
    cursor = conn.cursor()

    postgres_select(cursor, key)

    if cursor.rowcount is 0:
        raise KeyError
    value = cursor.fetchone()[1]

    conn.close()
    jsonobj = json.loads(value.decode('utf8'))
    return jsonobj


def postgres_insert(key, value):
    
    conn = get_conn()
    cursor = conn.cursor()

    postgres_delete(cursor, key)

    ins_sql = replace_table("INSERT INTO %(kwarg)s (sess_id, sess_json) VALUES (?, ?)")
    ins_params = [str(key), json.dumps(value).encode('utf8')]

    cursor.execute(ins_sql, ins_params)

    conn.commit()
    conn.close()


def get_conn():

    params = {
        'serverName': 'localhost:5432',
        'databaseName': 'touchform_sessions',
        'user': settings.POSTGRES_USERNAME,
        'password': settings.POSTGRES_PASSWORD,
    }

    try:
        # try to connect regularly
        conn = apply(zxJDBC.connectx, ("org.postgresql.jdbc3.Jdbc3PoolingDataSource",), params)
    except:
        # else fall back to this workaround
        jarloader = classPathHacker.classPathHacker()
        a = jarloader.addFile(settings.POSTGRES_JDBC_JAR)
        conn = apply(zxJDBC.connectx, ("org.postgresql.jdbc3.Jdbc3PoolingDataSource",), params)

    return conn


def replace_table(qry):
    table = settings.POSTGRES_TABLE
    return qry % {'kwarg': table}


# now deprecated old method, used for fallback
def cache_get_old(key):
    try:
        with open(cache_path_old(key)) as f:
            return json.loads(f.read().decode('utf8'))
    except IOError:
        raise KeyError
    except JSONDecodeError:
        raise EmptyCacheFileException((
            u"Unfortunately an error has occurred on the server and your form cannot be saved. "
            u"Please take note of the questions you have filled out so far, then refresh this page and enter them again. "
            u"If this problem persists, please report an issue."
        ))


def cache_path_old(key):
    persistence_dir = settings.PERSISTENCE_DIRECTORY or tempfile.gettempdir()
    if not os.path.exists(persistence_dir):
        os.makedirs(persistence_dir)
    return os.path.join(persistence_dir, 'tfsess-%s' % key)