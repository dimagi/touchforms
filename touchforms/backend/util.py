from java.util import Date
from java.util import Vector
import jarray

from datetime import datetime, date, time

from setup import init_classpath
init_classpath()
import com.xhaus.jyson.JysonCodec as json

datetime.__json__ = lambda self: json.dumps(self.strftime('%Y-%m-%d'))
date.__json__ = lambda self: json.dumps(self.strftime('%Y-%m-%d'))
time.__json__ = lambda self: json.dumps(self.strftime('%H:%M'))

from org.javarosa.core.model import FormIndex
FormIndex.__json__ = lambda self: json.dumps(str(self))
FormIndex.__str__ = lambda self: str_form_index(self)
FormIndex.__repr__ = FormIndex.__json__

def to_jdate(pdate):
    return Date(pdate.year - 1900, pdate.month - 1, pdate.day)

def to_jtime(ptime):
    return Date(1970, 0, 1, ptime.hour, ptime.minute)

def to_pdate(jdate):
    return datetime(jdate.getYear() + 1900, jdate.getMonth() + 1, jdate.getDate())

def to_ptime(jtime):
    return time(jtime.getHours(), jtime.getMinutes())

def to_vect(it):
    v = Vector()
    for e in it:
        v.addElement(e)
    return v

def to_arr(it, type):
    return jarray.array(it, type)

def str_form_index(form_ix):
    if form_ix.isBeginningOfFormIndex():
        return '<'
    elif form_ix.isEndOfFormIndex():
        return '>'
    else:
        def expand(form_ix):
            if form_ix != None:
                yield form_ix
                for step in expand(form_ix.getNextLevel()):
                    yield step
        steps = list(expand(form_ix))
        def str_step(step):
            i = step.getLocalIndex()
            mult = step.getInstanceIndex()
            try:
                suffix = {-1: '', -10: 'J'}[mult]
            except KeyError:
                suffix = ':%d' % mult
            return str(i) + suffix
        return ','.join(str_step(step) for step in steps)

def index_from_str(s_ix, form):
    if s_ix is None:
        return None
    elif s_ix == '<':
        return FormIndex.createBeginningOfFormIndex()
    elif s_ix == '>':
        return FormIndex.createEndOfFormIndex()

    def step_from_str(step):
        if step.endswith('J'):
            i = int(step[:-1])
            mult = -10
        else:
            pieces = step.split(':')
            i = int(pieces[0])
            try:
                mult = int(pieces[1])
            except IndexError:
                mult = -1
        return (i, mult)

    ix = reduce(lambda cur, (i, mult): FormIndex(cur, i, mult, None),
                (step_from_str(step) for step in reversed(s_ix.split(','))),
                None)
    ix.assignRefs(form)
    return ix
