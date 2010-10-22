from django.contrib.auth.models import User 
from bhoma.utils.couch.database import get_db
from bhoma.utils.logging import log_exception


def database_is_down():
    # just ping the db this way.  failures can propagate.  
    User.objects.count()
    return False
    
def couch_is_down():
    info = get_db().info() 
    return info is None or info["doc_count"] == 0
    

