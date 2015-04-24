from setup import init_classpath
init_classpath()

from org.javarosa.core.model.condition import IFunctionHandler

import logging

def attach_handlers(form, extensions):

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
                is_handler = any(issubclass(obj, baseclass) and obj != baseclass for baseclass in [IFunctionHandler])
            except TypeError:
                is_handler = False

            if is_handler:
                handler = obj()
                logging.debug('adding handler [%s / %s] from module [%s]' % (name, handler.getName(), ext))
                form.exprEvalContext.addFunctionHandler(handler)
