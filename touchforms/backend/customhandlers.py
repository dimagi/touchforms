import jarray
import java.lang

from util import to_vect
from setup import init_classpath
init_classpath()

from org.javarosa.core.model.condition import IFunctionHandler

import logging

def attach_handlers(form, extensions, context):
    """
    Attach custom function handlers to the session.

    The slug of the handler must be found in the context in order for it to be used.

    The context can contain a list of initialization parameters for initializing those handlers.

    See StaticFunctionHandler for usage example.
    """

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
                is_handler = any(issubclass(obj, baseclass) and obj != baseclass for baseclass in [TouchformsFunctionHandler])
            except TypeError:
                is_handler = False

            if is_handler:
                if obj.slug() in context:
                    for item in context[obj.slug()]:
                        handler = obj(**item)
                        logging.debug('adding handler [%s / %s] from module [%s]' % (name, handler.getName(), ext))
                        form.exprEvalContext.addFunctionHandler(handler)


class TouchformsFunctionHandler(IFunctionHandler):

    @classmethod
    def slug(self):
        raise NotImplementedError()

    def getPrototypes(self):
        return to_vect([jarray.array([], java.lang.Class)])

    def rawArgs(self):
        return False

    def realTime(self):
        return False
