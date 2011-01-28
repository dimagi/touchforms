from subprocess import PIPE, Popen
from django.conf import settings
from django.core.exceptions import PermissionDenied


def shutdown():
    """
    Shutdown the system. Return success or no.
    """
    if settings.BHOMA_CAN_POWER_DOWN_SERVER:
        shutdown_proc = Popen("sudo shutdown -P now", stdout=PIPE, stderr=PIPE, shell=True)
        ret = shutdown_proc.wait()
        return ret == 0
    else:
        raise PermissionDenied("This machine does not allow for remote shut down!")