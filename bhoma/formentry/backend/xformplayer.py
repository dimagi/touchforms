from __future__ import with_statement
import sys
import os
from datetime import datetime
import threading

from java.util import Date
from java.util import Vector
from java.io import StringReader

import preloadhandler
from util import to_jdate, to_pdate, to_vect
    
from setup import init_classpath
import logging
init_classpath()

from org.javarosa.xform.parse import XFormParser
from org.javarosa.form.api import FormEntryModel, FormEntryController
from org.javarosa.core.model import Constants
from org.javarosa.core.model.data import *
from org.javarosa.core.model.data.helper import Selection
from org.javarosa.model.xform import XFormSerializingVisitor as FormSerializer

class NoSuchSession(Exception):
  pass

class global_state_mgr:
  instances = {}
  instance_id_counter = 0

  session_cache = {}
  session_id_counter = 0
  
  def __init__(self):
    self.lock = threading.Lock()
  
  def new_session(self, xfsess):
    with self.lock:
      self.session_id_counter += 1
      self.session_cache[self.session_id_counter] = xfsess
    return self.session_id_counter
  
  def get_session(self, session_id):
    with self.lock:
      try:
        return self.session_cache[session_id]
      except KeyError:
        raise NoSuchSession()
    
  #todo: we're not calling this currently, but should, or else xform sessions will hang around in memory forever    
  def destroy_session(self, session_id):
    with self.lock:
      try:
        del self.session_cache[session_id]
      except KeyError:
        raise NoSuchSession()
    
  def save_instance(self, data):        
    with self.lock:
      self.instance_id_counter += 1
      self.instances[self.instance_id_counter] = data
    return self.instance_id_counter

  #todo: add ways to get xml, delete xml, and option not to save xml at all

global_state = global_state_mgr()
  

def load_form(xform, instance=None, preload_data={}):
    form = XFormParser.getFormDef(StringReader(xform))
    if instance != None:
    #todo: support hooking up a saved instance
        pass

    #todo: fix circular import
    for key, data_dict in preload_data.items():
        handler = preloadhandler.StaticPreloadHandler(key, data_dict)
        logging.debug("Adding preloader for %s data: %s" % (key, data_dict))
        form.getPreloader().addPreloadHandler(handler)
    
    for funchandler in [preloadhandler.XFuncPrettify]:
        handler = funchandler()
        logging.debug("Adding function handler for [%s]" % handler.getName())
        form.exprEvalContext.addFunctionHandler(handler)

    form.initialize(instance == None)
    return form

class SequencingException(Exception):
    pass

class XFormSession:
    def __init__(self, xform_raw=None, xform_path=None, instance_raw=None, instance_path=None,
                 preload_data={}):
        self.lock = threading.Lock()

        def content_or_path(content, path):
            if content != None:
                return content
            elif path != None:
                with open(path) as f:
                    return f.read()
            else:
                return None

        xform = content_or_path(xform_raw, xform_path)
        instance = content_or_path(instance_raw, instance_path)

        if instance != None:
            raise ValueError('don\'t support loading saved forms yet')

        self.form = load_form(xform, instance, preload_data)
        self.fem = FormEntryModel(self.form)
        self.fec = FormEntryController(self.fem)
        self._parse_current_event()

    def __enter__(self):
        if not self.lock.acquire(False):
            raise SequencingException()
        return self

    def __exit__(self, *_):
        self.lock.release()
 
    def output(self):
        if self.cur_event['type'] != 'form-complete':
            #warn that not at end of form
            pass

        instance_bytes = FormSerializer().serializeInstance(self.form.getInstance())
        return unicode(''.join(chr(b) for b in instance_bytes.tolist()), 'utf-8')

    def _parse_current_event (self):
        event = {}

        status = self.fem.getEvent()
        if status == self.fec.EVENT_BEGINNING_OF_FORM:
            event['type'] = 'form-start'
        elif status == self.fec.EVENT_END_OF_FORM:
            event['type'] = 'form-complete'
            self.fem.getForm().postProcessInstance() 
        elif status == self.fec.EVENT_QUESTION:
            event['type'] = 'question'
            self._parse_question(event)
        elif status == self.fec.EVENT_REPEAT_JUNCTURE:
            event['type'] = 'repeat-juncture'
            self._parse_repeat_juncture(event)
        else:
            event['type'] = 'sub-group'
            event['caption'] = self.fem.getCaptionPrompt().getLongText()
            if status == self.fec.EVENT_GROUP:
                event['repeatable'] = False
            elif status == self.fec.EVENT_REPEAT:
                event['repeatable'] = True
                event['exists'] = True
            elif status == self.fec.EVENT_PROMPT_NEW_REPEAT: #obsolete
                event['repeatable'] = True
                event['exists'] = False

        self.cur_event = event
        return event

    def _get_question_choices(self, q):
        return [choice(q, ch) for ch in q.getSelectChoices()]

    def _parse_style_info(self, rawstyle):
        info = {}

        if rawstyle != None:
            info['raw'] = rawstyle
            try:
                info.update([[p.strip() for p in f.split(':')][:2] for f in rawstyle.split(';') if f.strip()])
            except ValueError:
                pass

        return info

    def _parse_question (self, event):
        q = self.fem.getQuestionPrompt()

        event['caption'] = q.getLongText()
        event['help'] = q.getHelpText()
        event['style'] = self._parse_style_info(q.getAppearanceHint())

        if q.getControlType() == Constants.CONTROL_TRIGGER:
            event['datatype'] = 'info'
        else:
            event['datatype'] = {
              Constants.DATATYPE_NULL: 'str',
              Constants.DATATYPE_TEXT: 'str',
              Constants.DATATYPE_INTEGER: 'int',
              Constants.DATATYPE_DECIMAL: 'float',
              Constants.DATATYPE_DATE: 'date',
              Constants.DATATYPE_CHOICE: 'select',
              Constants.DATATYPE_CHOICE_LIST: 'multiselect',
            }[q.getDataType()]

            if event['datatype'] in ('select', 'multiselect'):
                event['choices'] = self._get_question_choices(q)

            event['required'] = q.isRequired()

            value = q.getAnswerValue()
            if value == None:
                event['answer'] = None
            elif event['datatype'] == 'int':
                event['answer'] = value.getValue()
            elif event['datatype'] == 'float':
                event['answer'] = value.getValue()
            elif event['datatype'] == 'str':
                event['answer'] = value.getValue()
            elif event['datatype'] == 'date':
                event['answer'] = to_pdate(value.getValue())
            elif event['datatype'] == 'select':
                event['answer'] = value.getValue().index + 1
            elif event['datatype'] == 'multiselect':
                event['answer'] = [sel.index + 1 for sel in value.getValue()]

    def _parse_repeat_juncture(self, event):
        r = self.fem.getCaptionPrompt()
        ro = r.getRepeatOptions()

        event['main-header'] = ro.header
        event['repetitions'] = list(r.getRepetitionsText())

        event['add-choice'] = ro.add
        event['del-choice'] = ro.delete
        event['del-header'] = ro.delete_header
        event['done-choice'] = ro.done

    def next_event (self):
        self.fec.stepToNextEvent()
        return self._parse_current_event()

    def back_event (self):
        self.fec.stepToPreviousEvent()
        return self._parse_current_event()

    def answer_question (self, answer):
        if self.cur_event['type'] != 'question':
            raise ValueError('not currently on a question')

        datatype = self.cur_event['datatype']
        if answer == None or str(answer).strip() == '' or answer == [] or datatype == 'info':
            ans = None
        elif datatype == 'int':
            ans = IntegerData(int(answer))
        elif datatype == 'float':
            ans = DecimalData(float(answer))
        elif datatype == 'str':
            ans = StringData(str(answer))
        elif datatype == 'date':
            ans = DateData(to_jdate(datetime.strptime(str(answer), '%Y-%m-%d').date()))
        elif datatype == 'select':
            ans = SelectOneData(self.cur_event['choices'][int(answer) - 1].to_sel())
        elif datatype == 'multiselect':
            if hasattr(answer, '__iter__'):
                ans_list = answer
            else:
                ans_list = str(answer).split()
            ans = SelectMultiData(to_vect(self.cur_event['choices'][int(k) - 1].to_sel() for k in ans_list))

        result = self.fec.answerQuestion(ans)
        if result == self.fec.ANSWER_REQUIRED_BUT_EMPTY:
            return {'status': 'error', 'type': 'required'}
        elif result == self.fec.ANSWER_CONSTRAINT_VIOLATED:
            q = self.fem.getQuestionPrompt()
            return {'status': 'error', 'type': 'constraint', 'reason': q.getConstraintText()}
        elif result == self.fec.ANSWER_OK:
            return {'status': 'success'}

    def descend_repeat (self, ix=None):
        if ix:
            self.fec.descendIntoRepeat(ix - 1)
        else:
            self.fec.descendIntoNewRepeat()

        return self._parse_current_event()

    def delete_repeat (self, ix):
        self.fec.deleteRepeat(ix - 1)
        return self._parse_current_event()

    #obsolete
    def new_repetition (self):
      #current in the form api this always succeeds, but theoretically there could
      #be unsatisfied constraints that make it fail. how to handle them here?
      self.fec.newRepeat(self.fem.getFormIndex())

class choice(object):
    def __init__(self, q, select_choice):
        self.q = q
        self.select_choice = select_choice

    def to_sel(self):
        return Selection(self.select_choice)

    def to_json(self):
        return self.q.getSelectChoiceText(self.select_choice)

def open_form (form_name, preload_data={}):
    if not os.path.exists(form_name):
        return {'error': 'no form found at %s' % form_name}

    xfsess = XFormSession(xform_path=form_name, preload_data=preload_data)
    sess_id = global_state.new_session(xfsess)
    first_event = xfsess.next_event()
    return {'session_id': sess_id, 'event': first_event}

def answer_question (session_id, answer):
    with global_state.get_session(session_id) as xfsess:
        result = xfsess.answer_question(answer)
        if result['status'] == 'success':
            return {'status': 'accepted', 'event': next_event(xfsess)}
        else:
            result['status'] = 'validation-error'
            return result

def edit_repeat (session_id, ix):
    with global_state.get_session(session_id) as xfsess:
        ev = xfsess.descend_repeat(ix)
        return {'event': ev}

def new_repeat (session_id):
    with global_state.get_session(session_id) as xfsess:
        ev = xfsess.descend_repeat()
        return {'event': ev}

def delete_repeat (session_id, ix):
    with global_state.get_session(session_id) as xfsess:
        ev = xfsess.delete_repeat(ix)
        return {'event': ev}

def new_repetition (session_id):
    with global_state.get_session(session_id) as xfsess:
        #new repeat creation currently cannot fail, so just blindly proceed to the next event
        xfsess.new_repetition()
        return {'event': next_event(xfsess)}

def skip_next (session_id):
    with global_state.get_session(session_id) as xfsess:
        return {'event': next_event(xfsess)}

def go_back (session_id):
    with global_state.get_session(session_id) as xfsess:
        (at_start, event) = prev_event(xfsess)
        return {'event': event, 'at-start': at_start}

def next_event (xfsess):
    ev = xfsess.next_event()
    if ev['type'] != 'form-complete':
        return ev
    else:
        (instance_id, xml) = save_form(xfsess)
        ev['save-id'] = instance_id
        ev['output'] = xml
        return ev

def prev_event (xfsess):
    at_start, ev = False, xfsess.back_event()
    if ev['type'] == 'form-start':
        at_start, ev = True, xfsess.next_event()
    return at_start, ev

def save_form (xfsess):
    xml = xfsess.output()
    instance_id = global_state.save_instance(xml)
    return (instance_id, xml)
