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

CASE_API_URL = 'http://192.168.7.139:8000/a/{{DOMAIN}}/cloudcare/api/cases'

def query_case_ids(q):
  return [c['case_id'] for c in q(CASE_API_URL)]

def query_cases(q, criteria):
  query_url = '%s?%s' % (CASE_API_URL, urllib.urlencode(criteria))
  return [case_from_json(cj) for cj in q(query_url)]

def query_case(q, case_id):
  cases = query_cases(q, {'case_id': case_id})
  try:
    return cases[0]
  except IndexError:
    return None

def query_factory(domain, user, auth):
  def api_query(_url):
    if not auth:
      req = lambda url: urllib2.urlopen(url)
    elif auth['type'] == 'django-session':
      def req(url):
        opener = urllib2.build_opener()
        opener.addheaders.append(('Cookie', 'sessionid=%s' % auth['key']))
        return opener.open(url)
    elif auth['type'] == 'http':
      raise Exception('not supported')
    elif auth['type'] == 'oauth':
      raise Exception('not supported')

    url = domain.join(_url.split('{{DOMAIN}}'))
    logging.debug('querying %s' % url)
    f = req(url)
    return json.loads(f.read())

  return api_query

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
  def __init__(self, domain, user, auth):
    self.query_func = query_factory(domain, user, auth)

    self.case_ids = dict(enumerate(query_case_ids(self.query_func)))
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
      self.put_case(query_case(self.query_func, case_id))

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

      cases = query_cases(self.query_func, {key: value})
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

    def __init__(self, sessionvars, api_auth):
        self.vars = sessionvars
        self.auth = api_auth

    def generateRoot(self, instance):
        ref = instance.getReference()
    
        def from_bundle(inst):
            root = inst.getRoot()
            root.setParent(instance.getBase())
            return root

        if 'casedb' in ref:
            return CaseInstanceTreeElement(instance.getBase(), CaseDatabase(self.vars['domain'], self.vars['username'], self.auth), False);
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


