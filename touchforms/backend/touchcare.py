import urllib2
import urllib
import com.xhaus.jyson.JysonCodec as json
import logging
from datetime import datetime

import settings

from org.javarosa.core.model.instance import InstanceInitializationFactory
from org.javarosa.core.services.storage import IStorageUtilityIndexed
from org.javarosa.core.services.storage import IStorageIterator
from org.commcare.cases.instance import CaseInstanceTreeElement
from org.commcare.cases.model import Case
from org.commcare.util import CommCareSession
from org.commcare.xml import TreeElementParser

from org.javarosa.xpath.expr import XPathFuncExpr
from org.javarosa.xpath import XPathParseTool
from org.javarosa.core.model.condition import EvaluationContext
from org.javarosa.core.model.instance import ExternalDataInstance
from org.javarosa.core.model.instance import DataInstance

from org.kxml2.io import KXmlParser


from util import to_vect, to_jdate, to_hashtable, to_input_stream

def query_case_ids(q):
    return [c['case_id'] for c in q(settings.CASE_API_URL)]

def query_cases(q, criteria=None):
    query_url = '%s?%s' % (settings.CASE_API_URL, urllib.urlencode(criteria)) if criteria else settings.CASE_API_URL
    return [case_from_json(cj) for cj in q(query_url)]

def query_case(q, case_id):
    cases = query_cases(q, {'case_id': case_id})
    try:
        return cases[0]
    except IndexError:
        return None

def query_factory(domain, auth, format="json"):
    
    def api_query(_url):
        url = domain.join(_url.split('{{DOMAIN}}'))
        if not auth:
            req = lambda url: urllib2.urlopen(url)
        elif auth['type'] == 'django-session':
            opener = urllib2.build_opener()
            opener.addheaders.append(('Cookie', 'sessionid=%s' % auth['key']))
            req = lambda url: opener.open(url)
        elif auth['type'] == 'oauth':
            # auth['key'] will be the oauth access token
            raise Exception('not supported yet')
        elif auth['type'] in ('http', 'http-digest'):
            password_mgr = urllib2.HTTPPasswordMgrWithDefaultRealm()
            password_mgr.add_password(None, url, auth['username'], auth['key'])
            handler = {
                'http':        urllib2.HTTPBasicAuthHandler,
                'http-digest': urllib2.HTTPDigestAuthHandler,
            }[auth['type']](password_mgr)
            opener = urllib2.build_opener(handler)
            req = lambda url: opener.open(url)
        
        return req(url).read()
    
    def json_query(_url):
        return json.loads(api_query(_url))
        
    if format == "json":
        return json_query
    elif format == "raw":
        return api_query
    else:
        raise ValueError("Bad api query format: %s" % format)

def case_from_json(data):
    c = Case()
    c.setCaseId(data['case_id'])
    c.setTypeId(data['properties']['case_type'])
    c.setName(data['properties']['case_name'])
    c.setClosed(data['closed'])
    if data['properties']['date_opened']:
        c.setDateOpened(to_jdate(datetime.strptime(data['properties']['date_opened'], '%Y-%m-%dT%H:%M:%S'))) # 'Z' in fmt string omitted due to jython bug
    c.setUserId(data['user_id'] or "")

    for k, v in data['properties'].iteritems():
        if v is not None and k not in ['case_name', 'case_type', 'date_opened']:
            c.setProperty(k, v)

    for k, v in data['indices'].iteritems():
        c.setIndex(k, v['case_type'], v['case_id'])

    return c

class CaseDatabase(IStorageUtilityIndexed):
    def __init__(self, domain, user, auth, additional_filters={}):
        self.query_func = query_factory(domain, auth)

        self.cases = {}
        self.additional_filters = additional_filters
        all_cases = query_cases(self.query_func, criteria=additional_filters)
        for c in all_cases:
            self.put_case(c)
        
        self.case_ids = dict(enumerate(self.cases.keys()))
        
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

            get_val = {
                'case-id': lambda c: c.getCaseId(),
                'case-type': lambda c: c.getTypeId(),
                'case-status': lambda c: 'closed' if c.isClosed() else 'open',
            }[field_name]
            
            cases = [c for c in self.cases.values() if get_val(c) == value]
            self.cached_lookups[(field_name, value)] = cases

        cases = self.cached_lookups[(field_name, value)]
        id_map = dict((v, k) for k, v in self.case_ids.iteritems())
        return to_vect(id_map[c.getCaseId()] for c in cases)

    def getNumRecords(self):
        return len(self.cases)

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
        self.fixtures = {}

    def generateRoot(self, instance):
        ref = instance.getReference()
    
        def from_bundle(inst):
            root = inst.getRoot()
            root.setParent(instance.getBase())
            return root

        if 'casedb' in ref:
            return CaseInstanceTreeElement(instance.getBase(), 
                        CaseDatabase(self.vars['domain'], self.vars['user_id'], 
                                     self.auth, self.vars.get("additional_filters", {})),
                        False)
        elif 'fixture' in ref:
            fixture_id = ref.split('/')[-1]
            user_id = self.vars['user_id']
            ret = self._get_fixture(user_id, fixture_id)
            # Unclear why this is necessary but it is
            ret.setParent(instance.getBase())
            return ret
        elif 'session' in ref:
            meta_keys = ['device_id', 'app_version', 'username', 'user_id']
            exclude_keys = ['additional_filters']
            sess = CommCareSession(None) # will not passing a CCPlatform cause problems later?
            for k, v in self.vars.iteritems():
                if k not in meta_keys and k not in exclude_keys:
                    sess.setDatum(k, v)

            return from_bundle(sess.getSessionInstance(*[self.vars.get(k, '') for k in meta_keys]))
    
    def _get_fixture(self, user_id, fixture_id):
        query_url = '%(base)s/%(user)s/%(fixture)s' % { "base": settings.FIXTURE_API_URL, 
                                                        "user": user_id,
                                                        "fixture": fixture_id }
        q = query_factory(self.vars['domain'], self.auth, format="raw")
        results = q(query_url)
        parser = KXmlParser()
        parser.setInput(to_input_stream(results), "UTF-8")
        parser.setFeature(KXmlParser.FEATURE_PROCESS_NAMESPACES, True)
        parser.next()
        return TreeElementParser(parser, 0, fixture_id).parse()
        

SUPPORTED_ACTIONS = ["touchcare-filter-cases"]

# API stuff
def handle_request (content, **kwargs):
    action = content['action']
    if action == "touchcare-filter-cases":
        return filter_cases(content)
    else:
        return {'error': 'unrecognized action'}

            
def filter_cases(content):
    try: 
        modified_xpath = "join(',', instance('casedb')/casedb/case%(filters)s/@case_id)" % \
                {"filters": content["filter_expr"]}
            
        api_auth = content.get('hq_auth')
        session_data = content.get("session_data", {})
        ccInstances = CCInstances(session_data, api_auth)
        caseInstance = ExternalDataInstance("jr://instance/casedb", "casedb")
        caseInstance.initialize(ccInstances, "casedb")
        instances = to_hashtable({"casedb": caseInstance})
        case_list = XPathFuncExpr.toString(XPathParseTool.parseXPath(modified_xpath)\
            .eval(EvaluationContext(None, instances)))
        return {'cases': filter(lambda x: x,case_list.split(","))}
    except Exception, e:
        return {'error': str(e)}
