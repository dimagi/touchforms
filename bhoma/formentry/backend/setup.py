import sys
import os

BHOMA_BASE = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

def init_classpath():
    for jar in ('javarosa-libraries.jar', 'kxml2-2.3.0.jar', 'regexp-me.jar'):
        if jar not in sys.path:
            sys.path.append(os.path.join(BHOMA_BASE, "formentry", "jrlib", jar))

