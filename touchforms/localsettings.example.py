# you can override settings here
XFORMS_PLAYER_URL = "http://localhost:4444/"

COUCH_SERVER_ROOT = 'localhost:5984'
COUCH_USERNAME = ''
COUCH_PASSWORD = ''
COUCH_DATABASE_NAME = 'xformplayer'

CACHE_BACKEND = "memcached://127.0.0.1:11211/"

POSTGRES_URL = "jdbc:postgresql:touchform_sessions"
POSTGRES_USERNAME = "wpride1"
POSTGRES_PASSWORD = "*******"
POSTGRES_DRIVER = "org.postgresql.Driver"
POSTGRES_TABLE = "sessions"
POSTGRES_JDBC_JAR = "/Users/Tom-Brady/commcare-hq/submodules/touchforms-src/touchforms/backend/jrlib/postgresql-9.4-1200.jdbc4.jar"