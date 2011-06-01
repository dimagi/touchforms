import sys
import os

CUR_DIR = os.path.dirname(__file__)

initialized = False

def init_classpath():
    global initialized
    if not initialized:
        for jar in ('javarosa-libraries.jar', 'kxml2-2.3.0.jar', 'regexp-me.jar', 'jyson-1.0.1.jar'):
            if jar not in sys.path:
                sys.path.append(os.path.join(CUR_DIR, "jrlib", jar))
        initialized = True

def init_jr_engine():
    from org.javarosa.model.xform import XFormsModule
    XFormsModule().registerModule()
