from setup import init_classpath
init_classpath()

from org.javarosa.core.model.utils import IPreloadHandler
# from org.javarosa.core.model.data import IAnswerData
from org.javarosa.core.model.data import StringData
# from org.javarosa.core.model.instance import TreeElement

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
    
