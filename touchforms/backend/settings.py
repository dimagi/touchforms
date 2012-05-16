
# TODO how to harmonize this with django settings?

CASE_API_URL = 'http://commcarehq.org/a/{{DOMAIN}}/cloudcare/api/cases'

HACKS_MODE = True

try:
    from localsettings import *
except ImportError:
    pass
