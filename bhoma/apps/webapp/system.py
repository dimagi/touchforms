from subprocess import PIPE, Popen
from django.conf import settings
from django.core.exceptions import PermissionDenied
import os


def shutdown():
    """
    Shutdown the system. Return success or no.
    """
    if settings.BHOMA_CAN_POWER_DOWN_SERVER:
        command = os.path.join(settings.BHOMA_ROOT_DIR, "scripts", "shutdown", "shutdown-wrapper") 
        shutdown_proc = Popen(command, stdout=PIPE, stderr=PIPE, shell=True)
        ret = shutdown_proc.wait()
        return ret == 0
    else:
        raise PermissionDenied("This machine does not allow for remote shut down!")