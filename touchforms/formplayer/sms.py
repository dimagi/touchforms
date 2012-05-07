from touchforms.formplayer.api import answer_question
from touchforms.formplayer.signals import sms_form_complete

def start_session(config):
    """
    Starts a session in touchforms based on the config. Returns a tuple 
    containing the session id and the list of initial responses (may be 
    more than one if there are a bunch of labels in the beginning of the
    form).
    """
    xformsresponse = config.start_session()
    # this is an implicit assert that the id is present and an integer
    session_id = int(xformsresponse.session_id)
    return (session_id,  
            list(_next_responses(xformsresponse, xformsresponse.session_id)))
    
def next_responses(session_id, answer, auth=None):
    xformsresponse = answer_question(session_id, _tf_format(answer), auth)
    for resp in _next_responses(xformsresponse, session_id, auth):
        yield resp

def _next_responses(xformsresponse, session_id, auth=None):
    if xformsresponse.is_error:
        yield xformsresponse
    elif xformsresponse.event.type == "question":
        yield xformsresponse
        if xformsresponse.event.datatype == "info":
            # We have to deal with Trigger/Label type messages 
            # expecting an 'ok' type response. So auto-send that 
            # and move on to the next question.
            response = answer_question(int(session_id),'ok', auth)
            for additional_resp in _next_responses(response, session_id, auth):
                yield additional_resp
    elif xformsresponse.event.type == "form-complete":
        sms_form_complete.send(sender="touchforms", session_id=session_id,
                               form=xformsresponse.event.output)
        yield xformsresponse

def _tf_format(text):
    # touchforms likes ints to be ints so force it if necessary.
    # any additional formatting needs can go here if they come up
    try:
        return int(text)
    except ValueError:
        return text
