import sys
import os

CUR_DIR = os.path.dirname(__file__)

def init_classpath():
    for jar in ('javarosa-libraries.jar', 'kxml2-2.3.0.jar', 'regexp-me.jar'):
        if jar not in sys.path:
            sys.path.append(os.path.join(CUR_DIR, "jrlib", jar))

