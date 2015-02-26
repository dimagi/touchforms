
# TODO how to harmonize this with django settings?

# allow cross-origin requests to touchforms daemon. if false, all access to
# daemon must be proxied through the django web server
ALLOW_CROSS_ORIGIN = False

# whether to save interim sessions so that they may be recovered after a
# daemon restart
PERSIST_SESSIONS = True
PERSISTENCE_DIRECTORY = None  # defaults to /tmp


# postgres peristence stuff

POSTGRES_URL = "jdbc:postgresql:touchform_sessions"  # whatever our DB name is after ':'
POSTGRES_USERNAME = "admin"
POSTGRES_PASSWORD = "*******"
POSTGRES_DRIVER = "org.postgresql.Driver"
POSTGRES_TABLE = "sessions"
POSTGRES_JDBC_JAR = "${COMMCARE_HOME}/submodules/touchforms-src/touchforms/backend/jrlib/postgresql-9.4-1200.jdbc4.jar"

# be more forgiving about data types in api
HACKS_MODE = True

# base url for touchcare api queries
URL_ROOT = "{{HOST}}/a/{{DOMAIN}}"

try:
    from localsettings import *
except ImportError:
    pass

CASE_API_URL = '%s/cloudcare/api/cases/' % URL_ROOT
FIXTURE_API_URL = '%s/cloudcare/api/fixtures' % URL_ROOT
LEDGER_API_URL = '%s/cloudcare/api/ledgers/' % URL_ROOT

