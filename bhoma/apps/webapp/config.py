from django.conf import settings
from bhoma.apps.locations.models import Location
from bhoma import const

def get_current_site():
    return Location.objects.get(slug__iexact=settings.BHOMA_CLINIC_ID)

def is_clinic():
    return get_current_site().type.slug == const.LOCATION_TYPE_CLINIC
        
    
    
    

