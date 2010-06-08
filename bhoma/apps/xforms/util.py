import os
import uuid

def get_xform_instance():
    """Get a fake instance from disk, for playing with"""
    filename = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "instances", "registration_demo.xml")
    text = open(filename, "r").read()
    text = text.replace("RESET_UID", str(uuid.uuid4()))
    return text