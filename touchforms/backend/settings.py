import logging.handlers
import sys

# TODO how to harmonize this with django settings?

# allow cross-origin requests to touchforms daemon. if false, all access to
# daemon must be proxied through the django web server
ALLOW_CROSS_ORIGIN = False

# whether to save interim sessions so that they may be recovered after a
# daemon restart
PERSIST_SESSIONS = True
PERSISTENCE_DIRECTORY = None  # defaults to /tmp
EXTENSION_MODULES = []  # you can allow extensions by overriding this

# be more forgiving about data types in api
HACKS_MODE = True

# base url for touchcare api queries
URL_ROOT = "{{HOST}}/a/{{DOMAIN}}"

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
    maxBytes=10 * 1024 * 1024,
    backupCount=20,
)
rotatingHandler.setFormatter(formatter)

logger.addHandler(rotatingHandler)
logger.setLevel(logging.INFO)
### END LOGGING CONFIG ###

CASE_API_URL = '%s/cloudcare/api/cases/' % URL_ROOT
FIXTURE_API_URL = '%s/cloudcare/api/fixtures' % URL_ROOT
LEDGER_API_URL = '%s/cloudcare/api/ledgers/' % URL_ROOT
