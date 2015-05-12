
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

try:
    from localsettings import *
except ImportError:
    pass

CASE_API_URL = '%s/cloudcare/api/cases/' % URL_ROOT
FIXTURE_API_URL = '%s/cloudcare/api/fixtures' % URL_ROOT
LEDGER_API_URL = '%s/cloudcare/api/ledgers/' % URL_ROOT

