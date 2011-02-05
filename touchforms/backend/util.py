from java.util import Date
from java.util import Vector

from datetime import datetime, time

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
