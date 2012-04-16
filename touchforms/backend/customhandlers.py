from setup import init_classpath
init_classpath()

from org.javarosa.core.model.utils import IPreloadHandler
from org.javarosa.core.model.condition import IFunctionHandler
from org.javarosa.core.model.data import StringData

import logging

def attach_handlers(form, extensions, preload_data={}):
    # default property preloader tries to access RMS; replace with a stub so as to
    # not break touchforms
    form.getPreloader().addPreloadHandler(StaticPreloadHandler('property', {}))

    # NOTE: PRELOADERS ARE DEPRECATED
    for key, data_dict in preload_data.iteritems():
        handler = StaticPreloadHandler(key, data_dict)
        logging.debug("Adding preloader for %s data: %s" % (key, data_dict))
        form.getPreloader().addPreloadHandler(handler)

    for ext in extensions:
        try:
            mod = __import__(ext, fromlist=['*'])
        except ImportError:
            #if this fails, make sure sys.path is correct, and that no intervening
            #__init__.py's do weird stuff (like reference django packages -- the
            #django context probably won't be set up)
            logging.error('unable to import xforms extension module [%s]' % ext)
            continue

        for obj, name in [(getattr(mod, o), o) for o in dir(mod) if not o.startswith('__')]:
            try:
                is_handler = any(issubclass(obj, baseclass) and obj != baseclass for baseclass in [IPreloadHandler, IFunctionHandler])
            except TypeError:
                is_handler = False

            if is_handler:
                handler = obj()
                logging.debug('adding handler [%s / %s] from module [%s]' % (name, handler.getName(), ext))
                form.exprEvalContext.addFunctionHandler(handler)

class StaticPreloadHandler(IPreloadHandler):
    """
    Statically preload things, based on an initial dictionary.
    
    Currently only supports strings
    """
    
    _dict = {}
    
    def __init__(self, name, dict, default=""):
        self._name = name
        self._dict = dict
        self._default = default
        
    def preloadHandled(self):
        return self._name
    
    def handlePreload(self, preloadParams):
        # TODO: support types other than strings?
        if preloadParams in self._dict:
            return StringData(self._dict[preloadParams])
        return StringData(self._default)
    
    def handlePostProcess(self, node, params):
        return False
    
