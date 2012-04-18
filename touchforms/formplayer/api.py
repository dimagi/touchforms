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
        self.caption = datadict.get("caption", "")
        self.datatype = datadict.get("datatype", "")
        self.output = datadict.get("output", "")
            
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
     
    Although errors come back more like this:
    {'status': 'validation-error', 
     'seq_id': 2, 
     'reason': 'some message about constraint', 
     'type': 'constraint'}
    
    
    """
    
    def __init__(self, datadict):
        self._dict = datadict
        self.is_error = False
        
        if "event" in datadict:
            self.event = XformsEvent(datadict["event"])
            self.text_prompt = self.event.text_prompt
        else:
            self.event = None
        
        self.seq_id = datadict["seq_id"]
        self.session_id = datadict.get("session_id", "")
        self.status = datadict.get("status", "")
        
        # custom logic to handle errors
        if self.status == "validation-error":
            assert self.event is None, "There should be no touchforms event for errors"
            self.is_error = True
            self.text_prompt = datadict.get("reason", "that is not a legal answer")
        elif self.event is None:
            raise "unhandleable response: %s" % json.dumps(datadict)
            
        
        
def post_data(data, url, content_type, auth=None):
    if auth:
        d = json.loads(data)
        d['hq_auth'] = {'type': 'django-session', 'key': auth}
        data = json.dumps(d)

    up = urlparse(url)
    headers = {}
    headers["content-type"] = content_type
    headers["content-length"] = len(data)
    conn = httplib.HTTPConnection(up.netloc)
    conn.request('POST', up.path, data, headers)
    resp = conn.getresponse()
    results = resp.read()
    return results

def get_response(data, url, auth=None):
    response = post_data(data, url, content_type="text/json", auth=auth)
    return XformsResponse(json.loads(response))

def start_form_session(form_path, content=None, language="", preloader_data={}):
    """
    Start a new form session
    """
    data = {"action":"new-form",
            "form-name": form_path,
            "instance-content": content,
            "preloader-data":{}}
    if language:
        data['lang'] = language
    
    return get_response(json.dumps(data), settings.XFORMS_PLAYER_URL)

def answer_question(session_id, answer):
    """
    Answer a question. 
    """
    data = {"action": "answer",
            "session-id": session_id,
            "answer":answer }
    return get_response(json.dumps(data), settings.XFORMS_PLAYER_URL)
    