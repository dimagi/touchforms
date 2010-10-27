import sys
import os

JAVAROSA_LIB_DIR = os.path.join(os.path.dirname(__file__), "jrlib")
            
def init_classpath():
    for jar in ('javarosa-libraries.jar', 'kxml2-2.3.0.jar', 'regexp-me.jar'):
        if jar not in sys.path:
            sys.path.append(os.path.join(JAVAROSA_LIB_DIR, jar))

