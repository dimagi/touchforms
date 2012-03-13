import urllib2
import urllib
import com.xhaus.jyson.JysonCodec as json
import logging
from datetime import datetime

from org.javarosa.core.model.instance import InstanceInitializationFactory
from org.javarosa.core.services.storage import IStorageUtilityIndexed
from org.javarosa.core.services.storage import IStorageIterator
from org.commcare.cases.instance import CaseInstanceTreeElement
from org.commcare.cases.model import Case
from org.commcare.util import CommCareSession

from util import to_vect, to_jdate

CASE_API_URL = 'http://192.168.7.139:8000/a/%s/cloudcare/api/cases'

DOMAIN = 'cloudcaredemo'
USER_ID = 'cory@cloudcaredemo.czue.org'

def api_query(url):
  logging.debug('querying %s' % url)
  f = urllib2.urlopen(url)
  return json.loads(f.read())

def query_case_ids(domain=DOMAIN, user_id=USER_ID):
  query_url = CASE_API_URL % domain
  return [c['case_id'] for c in api_query(query_url)]

def query_cases(field, value, domain=DOMAIN, user_id=USER_ID):
  query_url = '%s?%s' % (CASE_API_URL % domain, urllib.urlencode({field: value}))
  return [case_from_json(cj) for cj in api_query(query_url)]

def query_case(case_id, domain=DOMAIN, user_id=USER_ID):
  cases = query_cases('case_id', case_id, domain, user_id)
  try:
    return cases[0]
  except IndexError:
    return None

def case_from_json(data):
  c = Case()
  c.setCaseId(data['case_id'])
  c.setTypeId(data['properties']['case_type'])
  c.setName(data['properties']['case_name'])
  c.setClosed(data['closed'])
  c.setDateOpened(to_jdate(datetime.strptime(data['properties']['date_opened'], '%Y-%m-%dT%H:%M:%S'))) # 'Z' in fmt string omitted due to jython bug
  c.setUserId(data['user_id'])

  for k, v in data['properties'].iteritems():
    if v is not None and k not in ['case_name', 'case_type', 'date_opened']:
      c.setProperty(k, v)

  for k, v in data['indices'].iteritems():
    c.setIndex(k, v['case_type'], v['case_id'])

  return c

class CaseDatabase(IStorageUtilityIndexed):
  def __init__(self, user_id):
    self.case_ids = dict(enumerate(query_case_ids()))
    self.cases = {}
    self.cached_lookups = {}

  def put_case(self, c):
    self.cases[c.getCaseId()] = c

  def setReadOnly(self):
    pass

  def read(self, record_id):
    try:
      case_id = self.case_ids[record_id]
    except KeyError:
      return None

    logging.debug('read case %s' % case_id)
    if case_id not in self.cases:
      self.put_case(query_case(case_id))

    try:
      return self.cases[case_id]
    except KeyError:
      raise Exception('could not find a case for case id [%s]' % case_id)

  def getIDsForValue(self, field_name, value):
    logging.debug('case index lookup %s %s' % (field_name, value))

    if (field_name, value) not in self.cached_lookups:

      #get_val = {
      #  'case-id': lambda c: c.getCaseId(),
      #  'case-type': lambda c: c.getTypeId(),
      #  'case-status': lambda c: 'closed' if c.isClosed() else 'open',
      #}[field_name]

      key = {
        'case-id': 'case_id',
        'case-type': 'properties/case_type',
        'case-status': 'closed',
      }[field_name]
    
      # TODO: querying based on case status doesn't work on HQ end
      if field_name == 'case_status':
        value = {
          'open': 'false',
          'closed': 'true',
        }[value]

      cases = query_cases(key, value)
      for c in cases:
        self.put_case(c)
      self.cached_lookups[(field_name, value)] = cases

    cases = self.cached_lookups[(field_name, value)]
    id_map = dict((v, k) for k, v in self.case_ids.iteritems())
    return to_vect(id_map[c.getCaseId()] for c in cases)

  def getNumRecords(self):
    return len(self.case_ids)

  def iterate(self):
    return CaseIterator(self.case_ids.keys())


class CaseIterator(IStorageIterator):
  def __init__(self, case_ids):
    self.case_ids = case_ids
    self.i = 0

  def hasMore(self):
    return self.i < len(self.case_ids)

  def nextID(self):
    case_id = self.case_ids[self.i]
    self.i += 1
    return case_id


class CCInstances(InstanceInitializationFactory):

    def __init__(self, sessionvars):
        self.vars = sessionvars

    def generateRoot(self, instance):
        ref = instance.getReference()
    
        def from_bundle(inst):
            root = inst.getRoot()
            root.setParent(instance.getBase())
            return root

        if 'casedb' in ref:
            return CaseInstanceTreeElement(instance.getBase(), CaseDatabase(self.vars['user_id']), False);
        elif 'fixture' in ref:
            fixture_id = ref.split('/')[-1]
            user_id = self.vars['user_id']

            #	return from_bundle( CommCareUtil.loadFixtureForUser(fixture_id, userId)  )
            pass  # save till end... just get raw xml payload from HQ, i presume? -- look up based solely on user id
        elif 'session' in ref:
            meta_keys = ['device_id', 'app_version', 'username', 'user_id']

            sess = CommCareSession(None) # will not passing a CCPlatform cause problems later?
            for k, v in self.vars.iteritems():
                if k not in meta_keys:
                    sess.setDatum(k, v)

            return from_bundle(sess.getSessionInstance(*[self.vars.get(k, '') for k in meta_keys]))


