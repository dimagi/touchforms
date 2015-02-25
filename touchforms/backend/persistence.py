from __future__ import with_statement
import settings
from com.xhaus.jyson import JSONDecodeError
from xcp import EmptyCacheFileException
import com.xhaus.jyson.JysonCodec as json
from com.ziclix.python.sql import zxJDBC
import classPathHacker


def persist(sess):
    sess_id = sess.uuid
    state = sess.session_state()
    cache_set(sess_id, state)


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


def cache_set(key, value):
    if key is None:
        raise KeyError
    postgres_insert(key, value)


def cache_get(key):
    if key is None:
        raise KeyError
    try:
        return postgres_lookup(key)
    except JSONDecodeError:
        raise EmptyCacheFileException(_(
            u"Unfortunately an error has occurred on the server and your form cannot be saved. "
            u"Please take note of the questions you have filled out so far, then refresh this page and enter them again. "
            u"If this problem persists, please report an issue."
        ))


def cache_del(key):
    conn = get_conn()
    cursor = conn.cursor()
    delete_query = "DELETE FROM " + settings.POSTGRES_TABLE + " WHERE sess_id='" + key + "'"
    cursor.execute(delete_query)
    conn.commit()
    conn.close()


def postgres_lookup(key):
    conn = get_conn()
    cursor = conn.cursor()
    query = "SELECT sess_json FROM " + settings.POSTGRES_TABLE + " WHERE sess_id='" + key + "'"
    cursor.execute(query)
    value = cursor.fetchone()[0].getValue()[1:-1]   # yeah... this is terrible. We get the Row -> PGObject ->
                                                    # Unicode -> Strip [] so that json will convert to dict
    conn.close()
    jsonobj = json.loads(value.decode('utf8'))
    return jsonobj


def postgres_insert(key, value):
    conn = get_conn()
    cursor = conn.cursor()
    delete_query = "DELETE FROM " + settings.POSTGRES_TABLE + " WHERE sess_id='" + key + "'"
    insert_query = "INSERT INTO " + settings.POSTGRES_TABLE + " (sess_id, sess_json) VALUES ('" + key + "', $$[" + json.dumps(value).encode('utf8') + "]$$)"
    cursor.execute(delete_query)
    cursor.execute(insert_query)
    conn.commit()
    conn.close()


def get_conn():
    jdbc_url = settings.POSTGRES_URL
    username = settings.POSTGRES_USERNAME
    password = settings.POSTGRES_PASSWORD
    driver = settings.POSTGRES_DRIVER

    try:
        # if called from command line with .login CLASSPATH setup right,this works
        conn = zxJDBC.connect(jdbc_url, username, password, driver)
    except:
        # if called from Apache or account where the .login has not set CLASSPATH
        # need to use run-time CLASSPATH Hacker
        jarloader = classPathHacker.classPathHacker()
        a = jarloader.addFile(settings.POSTGRES_JDBC_JAR)
        conn = zxJDBC.connect(jdbc_url, username, password, driver)

    return conn