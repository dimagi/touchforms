from __future__ import absolute_import
import logging
import jarray
import java.lang

from .util import to_vect
from .setup import init_classpath
import six
init_classpath()

from org.javarosa.core.model.utils import IPreloadHandler
from org.javarosa.core.model.condition import IFunctionHandler
from org.javarosa.core.model.data import StringData
from org.commcare.util import ArrayDataSource
from org.javarosa.xform.util import CalendarUtils

logger = logging.getLogger('formplayer.customhandlers')


def attach_handlers(form, extensions, context, preload_data=None):
    """
    Attach custom function handlers to the session.

    The slug of the handler must be found in the context in order for it to be used.

    The context can contain a list of initialization parameters for initializing those handlers.

    See StaticFunctionHandler for usage example.
    """
    preload_data = preload_data or {}
    # default property preloader tries to access RMS; replace with a stub so as to
    # not break touchforms
    form.getPreloader().addPreloadHandler(StaticPreloadHandler('property', {}))

    CalendarUtils.setArrayDataSource(HardCodedArrayDataSource())

    # NOTE: PRELOADERS ARE DEPRECATED
    for key, data_dict in six.iteritems(preload_data):
        handler = StaticPreloadHandler(key, data_dict)
        logger.info("Adding preloader for %s data: %s" % (key, data_dict))
        form.getPreloader().addPreloadHandler(handler)


    for ext in extensions:
        try:
            mod = __import__(ext, fromlist=['*'])
        except ImportError:
            #if this fails, make sure sys.path is correct, and that no intervening
            #__init__.py's do weird stuff (like reference django packages -- the
            #django context probably won't be set up)
            logger.error('unable to import xforms extension module [%s]' % ext)
            continue

        for obj, name in [(getattr(mod, o), o) for o in dir(mod) if not o.startswith('__')]:
            try:
                is_handler = any(issubclass(obj, baseclass) and obj != baseclass for baseclass in [IPreloadHandler, TouchformsFunctionHandler])
            except TypeError:
                is_handler = False

            if is_handler:
                if obj.slug() in context:
                    for item in context[obj.slug()]:
                        handler = obj(**item)
                        logger.info('adding handler [%s / %s] from module [%s]' % (name, handler.getName(), ext))
                        form.exprEvalContext.addFunctionHandler(handler)


# We need this for old CloudCare, which doesn't have localizations
class HardCodedArrayDataSource(ArrayDataSource):
    def getArray(self, key):
        if (key == "nepali_months"):
            return ["Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik",
                    "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"]
        if (key == "ethiopian_months"):
            return ["Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit", "Megabit",
                    "Miazia", "Ginbot", "Senie", "Hamlie", "Nehasie", "Pagumien"]

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
