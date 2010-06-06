import os

def get_xform_instance():
    """Get a fake instance from disk, for playing with"""
    print "instance"
    filename = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "instances", "registration_demo.xml")
    print filename
    return open(filename, "r").read()