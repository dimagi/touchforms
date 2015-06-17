import logging.handlers
import sys
import os

# TODO how to harmonize this with django settings?

# allow cross-origin requests to touchforms daemon. if false, all access to
# daemon must be proxied through the django web server
ALLOW_CROSS_ORIGIN = False

# whether to save interim sessions so that they may be recovered after a
# daemon restart
PERSIST_SESSIONS = True
PERSISTENCE_DIRECTORY = None  # defaults to /tmp
EXTENSION_MODULES = []  # you can allow extensions by overriding this

# postgres peristence stuff
USES_POSTGRES = False
POSTGRES_TABLE = "formplayer_session"
POSTGRES_JDBC_JAR = "%s/jrlib/postgresql-9.4-1201.jdbc41.jar"%os.path.dirname(os.path.abspath(__file__))

# be more forgiving about data types in api
HACKS_MODE = True

# base url for touchcare api queries
URL_ROOT = "{{HOST}}/a/{{DOMAIN}}"

DATABASE = {
    'serverName': 'localhost:5432',
    'databaseName': 'hqdev',
    'user': 'django',
    'password': 'django',
    'prepareThreshold': 0
}

### LOGGING VARIABLES ###
FORMPLAYER_LOG_FILE = 'formplayer-dev.log'

formats = {
    'verbose': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s',
}
### END LOGGING VARIABLES ###


try:
    from localsettings import *
except ImportError:
    pass

### LOGGING CONFIG ###
formatter = logging.Formatter(formats['verbose'])

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format=formats['verbose']
)

logger = logging.getLogger('formplayer')

rotatingHandler = logging.handlers.RotatingFileHandler(
    FORMPLAYER_LOG_FILE,
    maxBytes=50 * 1024 * 1024,
    backupCount=20,
)
rotatingHandler.setFormatter(formatter)

logger.addHandler(rotatingHandler)
logger.setLevel(logging.INFO)
### END LOGGING CONFIG ###

CASE_API_URL = '%s/cloudcare/api/cases/' % URL_ROOT
FIXTURE_API_URL = '%s/cloudcare/api/fixtures' % URL_ROOT
LEDGER_API_URL = '%s/cloudcare/api/ledgers/' % URL_ROOT

