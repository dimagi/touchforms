from __future__ import with_statement
import settings
import tempfile
from com.xhaus.jyson import JSONDecodeError
from xcp import EmptyCacheFileException
import com.xhaus.jyson.JysonCodec as json
from com.ziclix.python.sql import zxJDBC
import classPathHacker
import os


def persist(sess):
    sess_id = sess.uuid
    state = sess.session_state()
    cache_set(sess_id, state)


def restore(sess_id, factory, override_state=None):

    print "restoring sess id: " + str(sess_id)

    try:
        state = cache_get(sess_id)
    except KeyError:
        return None

    state['uuid'] = sess_id
    if override_state:
        state.update(override_state)
    return factory(**state)


def cache_set(key, value):
    print "cache setting: " + str(key) + " + value: " + str(value)
    if key is None:
        raise KeyError
    if settings.USES_POSTGRES:
        postgres_set(key, value)
    else:
        with open(cache_get_file_path(key), 'w') as f:
            f.write(json.dumps(value).encode('utf8'))


def cache_get(key):

    print "cache getting: " + str(key)

    if key is None:
        raise KeyError
    if settings.USES_POSTGRES:
        try:
            return postgres_lookup(key)
        except KeyError:
            return cache_get_file(key)
    else:
        return cache_get_file(key)


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
    return postgres_helper(postgres_lookup_command, key)


def postgres_lookup_command(cursor, key):

    postgres_select(cursor, key)

    if cursor.rowcount is 0:
        raise KeyError
    value = cursor.fetchone()[1]

    jsonobj = json.loads(value.decode('utf8'))




    return jsonobj


def postgres_update_command(cursor, key, value):
    upd_sql = replace_table("UPDATE %(kwarg)s SET sess_json = ?  WHERE sess_id = ?")
    upd_params = [json.dumps(value).encode('utf8'), str(key)]
    cursor.execute(upd_sql, upd_params)


def postgres_insert_command(cursor, key, value):
    ins_sql = replace_table("INSERT INTO %(kwarg)s (sess_id, sess_json) VALUES (?, ?)")
    ins_params = [str(key), json.dumps(value).encode('utf8')]
    cursor.execute(ins_sql, ins_params)


def postgres_set(key, value):
    postgres_helper(postgres_set_command, key, value)


def postgres_set_command(cursor, key, value):

    postgres_select(cursor, key)

    if cursor.rowcount > 0:
        postgres_update_command(cursor, key, value)
    else:
        postgres_insert_command(cursor, key, value)


def postgres_helper(method, *kwargs):
    conn = get_conn()
    cursor = conn.cursor()
    ret = method(cursor, *kwargs)
    conn.commit()
    conn.close()
    return ret


def get_conn():

    params = settings.DATABASE

    try:
        # try to connect regularly

        print "Trying to get connection.:"

        conn = zxJDBC.connectx("org.postgresql.ds.PGPoolingDataSource", **params)

        print "Connection gotten on first try: " + str(conn)

    except:
        # else fall back to this workaround (we expect to do this)

        print "Except trying to get connection.:"

        jarloader = classPathHacker.classPathHacker()
        a = jarloader.addFile(settings.POSTGRES_JDBC_JAR)
        conn = zxJDBC.connectx("org.postgresql.ds.PGPoolingDataSource", **params)

        print "Connection gotten on second try: " + str(conn)

    return conn


def replace_table(qry):
    table = settings.POSTGRES_TABLE
    return qry % {'kwarg': table}


# now deprecated old method, used for fallback
def cache_get_file(key):
    try:
        with open(cache_get_file_path(key)) as f:
            return json.loads(f.read().decode('utf8'))
    except IOError:
        raise KeyError
    except JSONDecodeError:
        raise EmptyCacheFileException((
            u"Unfortunately an error has occurred on the server and your form cannot be saved. "
            u"Please take note of the questions you have filled out so far, then refresh this page and enter them again. "
            u"If this problem persists, please report an issue."
        ))


def cache_get_file_path(key):
    persistence_dir = settings.PERSISTENCE_DIRECTORY or tempfile.gettempdir()
    if not os.path.exists(persistence_dir):
        os.makedirs(persistence_dir)
    return os.path.join(persistence_dir, 'tfsess-%s' % key)