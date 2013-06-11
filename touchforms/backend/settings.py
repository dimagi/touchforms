
# TODO how to harmonize this with django settings?

URL_ROOT = "http://commcarehq.org/a/{{DOMAIN}}"

HACKS_MODE = True

SESSION_CACHE_URL = 'http://localhost:8000/session-cache/'

ALLOW_CROSS_ORIGIN = False

try:
    from localsettings import *
except ImportError:
    pass

CASE_API_URL = '%s/cloudcare/api/cases' % URL_ROOT
FIXTURE_API_URL = '%s/cloudcare/api/fixtures' % URL_ROOT

