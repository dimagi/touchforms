import json
from django.conf import settings
from urlparse import urlparse
import httplib


'''
A set of wrappers that return the JSON bodies you use to interact with the formplayer
backend for various sets of tasks.

This API is currently highly beta and could use some hardening. 
'''

class XformsEvent(object):
    """
    A wrapper for the json event object that comes back from touchforms, which 
    looks approximately like this:n
    
    { "datatype":"select",
      "style":{},
      "choices":["red","green","blue"],
      "caption":"What's your favorite color?",
      "type":"question",
      "answer":null,
      "required":0,
      "ix":"1",
      "help":null
    }
    """
    def __init__(self, datadict):
        self._dict = datadict
        self.type = datadict["type"]
        self.caption = datadict.get("caption")
        self.datatype = datadict.get("datatype")
        
            
    @property
    def text_prompt(self):
        """
        A text-only prompt for this. Used in pure text (or sms) mode.
        """
        if self.datatype == "select":
            return "%s %s" % \
                (self.caption,
                 ", ".join(["%s:%s" % (i, val) for i, val in \
                            enumerate(self._dict["choices"])]))
        else:
            return self.caption
        
class XformsResponse(object):
    """
    A wrapper for the json that comes back from touchforms, which 
    looks approximately like this:
    
    {"event":
        { "datatype":"select",
          "style":{},
          ... (see above)
         },
     "session_id": 12,
     "status":"accepted",
     "seq_id":1}
    """
    
    def __init__(self, datadict):
        self._dict = datadict
        self.event = XformsEvent(datadict["event"])
        self.status = datadict.get("status", "")
        self.seq_id = datadict["seq_id"]
        self.session_id = datadict.get("session_id", "")
        
        
        

def post_data(data, url, content_type):
    up = urlparse(url)
    headers = {}
    headers["content-type"] = content_type
    headers["content-length"] = len(data)
    conn = httplib.HTTPConnection(up.netloc)
    conn.request('POST', up.path, data, headers)
    resp = conn.getresponse()
    results = resp.read()
    return results

def get_response(data, url):
    response = post_data(data, url, content_type="text/json")
    return XformsResponse(json.loads(response))

def start_form_session(form_path, content=None, preloader_data={}):
    """
    Start a new form session
    """
    data = {"action":"new-form",
            "form-name": form_path,
            "instance-content": content,
            "preloader-data":{}}
    
    return get_response(json.dumps(data), settings.XFORMS_PLAYER_URL)

def answer_question(session_id, answer):
    """
    Answer a question. 
    """
    data = {"action": "answer",
            "session-id": session_id,
            "answer":answer }
    return get_response(json.dumps(data), settings.XFORMS_PLAYER_URL)
    