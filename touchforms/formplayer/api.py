import json
from django.conf import settings
from urlparse import urlparse
import httplib


'''
A set of wrappers that return the JSON bodies you use to interact with the formplayer
backend for various sets of tasks.

This API is currently highly beta and could use some hardening. 
'''

class TouchformsAuth(object):
    """
    Used to authenticate with touchforms
    """
    def __init__(self, type, key):
        self.type = type
        self.key = key
        
    def to_dict(self):
        return {'type': self.type, 'key': self.key}

class DjangoAuth(TouchformsAuth):
    
    def __init__(self, key):
        super(DjangoAuth, self).__init__("django-session", key)
            
class DigestAuth(TouchformsAuth):
    
    def __init__(self, username, password):
        self.username = username
        super(DigestAuth, self).__init__("http-digest", password)
        
    def to_dict(self):
        return {'type': self.type, 'key': self.key, 'username': self.username}

            
class XFormsConfigException(ValueError):
    pass

class XFormsConfig(object):
    
    def __init__(self, form_path=None, form_content=None, language="", 
                 session_data=None, preloader_data={}, instance_content=None,
                 touchforms_url=None, auth=None):
        
        if bool(form_path) == bool(form_content):
            raise XFormsConfigException\
                ("Can specify file path or content but not both!\n" 
                 "File Path: %s, Form Content: %s" % (form_path, form_content))
        
        self.form_path = form_path
        self.form_content = form_content
        self.language = language
        self.session_data = session_data        
        self.preloader_data = preloader_data        
        self.instance_content = instance_content
        self.touchforms_url = touchforms_url or settings.XFORMS_PLAYER_URL
        self.auth = auth
        
    def get_touchforms_dict(self):
        """
        Translates this config into something touchforms wants to 
        work with
        """
        
        vals = (("action", "new-form"),
                ("form-name", self.form_path),
                ("form-content", self.form_content),
                ("instance-content", self.instance_content),
                ("preloader-data", self.preloader_data),
                ("session-data", self.session_data),
                ("lang", self.language))
        
        # only include anything with a value, or touchforms gets mad
        return dict(filter(lambda x: x[1], vals))
        
    def start_session(self):
        """
        Start a new session based on this configuration
        """
        return get_response(json.dumps(self.get_touchforms_dict()), 
                            self.touchforms_url, auth=self.auth)
    
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
                 ", ".join(["%s:%s" % (i+1, val) for i, val in \
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
        d['hq_auth'] = auth.to_dict()
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
    try:
        return XformsResponse(json.loads(response))
    except Exception, e:
        print response
        raise e
                                                                               

def start_form_session(form_path, content=None, language="", preloader_data={}):
    """
    Start a new form session
    """
    # TODO: this method has been deprecated and the config object 
    # should just be used directly. Temporarily left to support legacy code.
    return XFormsConfig(form_path=form_path, 
                        instance_content=content,
                        preloader_data=preloader_data,
                        language=language).start_session()
    
def answer_question(session_id, answer, auth=None):
    """
    Answer a question. 
    """
    data = {"action": "answer",
            "session-id": session_id,
            "answer":answer }
    return get_response(json.dumps(data), settings.XFORMS_PLAYER_URL, auth)


