from django.conf import settings

def meta(request):
    return {
        'app_version': settings.REVISION if settings.REVISION else settings.RELEASE_VERSION,
    }
