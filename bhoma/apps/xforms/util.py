import os
import uuid
from bhoma.apps.xforms.models import XForm

def get_xform_by_namespace(namespace):
    matches = XForm.objects.filter(namespace=namespace).order_by("-version")
    if matches.count() > 0:
        return matches[0]
    else:
        raise Exception("No XForm found! Either the application wasn't " \
                        "bootstrapped properly or the database entry was " \
                        "deleted. Please syncdb and restart the server.")
    
    