import json
from django.conf import settings
import requests
import logging

"""
A set of wrappers that return the JSON bodies you use to interact with the formplayer
backend for various sets of tasks.

This API is currently highly beta and could use some hardening. 
"""

# Get an instance of a logger
logging = logging.getLogger(__name__)

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
        self.choices = datadict.get("choices", None)
            
    @property
    def text_prompt(self, select_display_func=None):
        """
        A text-only prompt for this. Used in pure text (or sms) mode.
        
        Allows you to pass in a function to override how selects are displayed.
        
        The signature of that function should take in the prompt and choice list
        and return a string. The default is select_to_text_compact
        """
        display_func = select_display_func or select_to_text_compact
        if self.datatype == "select" or self.datatype == "multiselect":
            return display_func(self.caption, self._dict["choices"])
        else:
            return self.caption

def select_to_text_compact(caption, choices):
    """
    A function to convert a select item to text in a compact format.
    Format is:
    
    [question] 1:[choice1], 2:[choice2]...
    """
    return "%s %s." % (caption,
                      ", ".join(["%s:%s" % (i+1, val) for i, val in \
                                 enumerate(choices)])) 

def select_to_text_readable(caption, choices):
    """
    A function to convert a select item to text in a more verbose, readable 
    format.
    Format is:
    
    [question] Send 1 for [choice1], 2 for [choice2]...
    """
    return "%s Send %s" % (caption,
                      ", ".join(["%s for %s" % (i+1, val) for i, val in \
                                 enumerate(choices)])) 

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
        self.error = None
        if "event" in datadict:
            self.event = XformsEvent(datadict["event"])
            self.text_prompt = self.event.text_prompt
        else:
            self.event = None
        
        self.seq_id = datadict.get("seq_id","")
        self.session_id = datadict.get("session_id", "") or datadict.get("session-id","")
        self.status = datadict.get("status", "")
        
        # custom logic to handle errors
        if self.status == "validation-error":
            assert self.event is None, "There should be no touchforms event for errors"
            self.is_error = True
            reason = datadict.get("reason")
            #"reason" could literally be None so manually put in default (as opposed to specifying it with .get()
            if reason is None:
                reason = "That is not a legal Answer"
            self.error = reason
        # custom logic to handle http related errors
        elif self.status == "http-error":
            assert self.event is None, "There should be no touchforms event for errors"
            self.error = datadict.get("error")
            self.is_error = True
            self.status_code = datadict.get("status_code")
            self.args = datadict.get("args")
            self.url = datadict.get("url")
        elif self.event is None:
            raise NotImplementedError("unhandleable response: %s" % json.dumps(datadict))
            
        
        
def post_data(data, url, content_type, auth=None):
    #try to convert data to json dict
    if not isinstance(data, str):
        try:
            data = json.dumps(data)
        except Exception:
            raise
    if auth:
        d = json.loads(data)
        d['hq_auth'] = {'type': 'django-session', 'key': auth}
        data = json.dumps(d)
    logging.debug('Posting Data: %s' % data)
    response = requests.post(url, data=data)
    logging.debug('HTTP Response:: %s' % response.content)
    return response, response.error

def get_response(data, url):
    response, error = post_data(data, url, content_type="text/json")
    if error:
        #weak input checking
        if isinstance(data, str):
            data = json.loads(data)
        logging.error('HTTP ERROR: %s' % str(error))
        logging.debug('RESPONSE.ERROR.MSG %s' % response.error.msg)
        d = {
            "response": response.content,
            "error": error,
            "status_code": response.status_code,
            "status": "http-error",
            "args": data,
            "url": url,
        }
        if data.get("session-id"):
            d["session-id"] = data["session-id"]
        return XformsResponse(d)

    return XformsResponse(json.loads(response.content))

def get_raw_instance(session_id):
    """
    Gets the raw xml instance of the current session regardless of the state that we're in (used for logging partially complete
    forms to couch when errors happen).
    """
    data = {
        "action":"get-instance",
        "session-id": session_id,
        }
    response, error = post_data(data, settings.XFORMS_PLAYER_URL, "text/json")
    if not error:
        logging.debug('Formplayer API got raw instance: %s' % response.content)
        ret = json.loads(response.content)
        return json.loads(response.content)["output"]
    else:
        return None

def start_form_session(form_path, content=None, language="", preloader_data={}):
    """
    Start a new form session
    """
    logging.debug('Starting a form session.')
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
    logging.debug('Answering question with session_id %s, answer: %s' % (session_id, answer))
    data = {"action": "answer",
            "session-id": session_id,
            "answer":answer }
    return get_response(json.dumps(data), settings.XFORMS_PLAYER_URL)
    