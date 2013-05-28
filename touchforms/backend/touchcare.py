import urllib
import com.xhaus.jyson.JysonCodec as json
import logging
from datetime import datetime
from copy import copy

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


from util import to_vect, to_jdate, to_hashtable, to_input_stream, query_factory

def query_case_ids(q, criteria=None):
    criteria = copy(criteria) or {} # don't modify the passed in dict
    criteria["ids_only"] = True
    query_url = '%s?%s' % (settings.CASE_API_URL, urllib.urlencode(criteria)) \
                    if criteria else settings.CASE_API_URL
    return [id for id in q(query_url)]

def query_cases(q, criteria=None):
    query_url = '%s?%s' % (settings.CASE_API_URL, urllib.urlencode(criteria)) \
                    if criteria else settings.CASE_API_URL
    return [case_from_json(cj) for cj in q(query_url)]

def query_case(q, case_id):
    cases = query_cases(q, {'case_id': case_id})
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
    if data['properties']['date_opened']:
        c.setDateOpened(to_jdate(datetime.strptime(data['properties']['date_opened'], '%Y-%m-%dT%H:%M:%S'))) # 'Z' in fmt string omitted due to jython bug
    owner_id = data['properties']['owner_id'] or data['user_id'] or ""
    c.setUserId(owner_id) # according to clayton "there is no user_id, only owner_id"

    for k, v in data['properties'].iteritems():
        if v is not None and k not in ['case_name', 'case_type', 'date_opened']:
            c.setProperty(k, v)

    for k, v in data['indices'].iteritems():
        c.setIndex(k, v['case_type'], v['case_id'])

    return c

class CaseDatabase(IStorageUtilityIndexed):
    def __init__(self, domain, user, auth, additional_filters=None,
                 preload=False):
        self.query_func = query_factory(domain, auth)
        self.additional_filters = additional_filters or {}
        self.cached_lookups = {}
        self._cases = {}
        self.fully_loaded = False # when we've loaded every possible case

        if preload:
            self.load_all_cases()
        else:
            case_ids = query_case_ids(self.query_func, criteria=self.additional_filters)
            self.case_ids = dict(enumerate(case_ids))

    @property
    def cases(self):
        if self.fully_loaded:
            return self._cases
        else:
            self.load_all_cases()
        return self._cases

    def load_all_cases(self):
        cases = query_cases(self.query_func,
                            criteria=self.additional_filters)
        for c in cases:
            self.put_case(c)
        self.case_ids = dict(enumerate(self._cases.keys()))
        self.fully_loaded = True

    def put_case(self, c):
        self._cases[c.getCaseId()] = c

    def setReadOnly(self):
        pass

    def read(self, record_id):
        try:
            case_id = self.case_ids[record_id]
        except KeyError:
            return None
        return self.readCase(case_id)

    def readCase(self, case_id):
        logging.debug('read case %s' % case_id)
        if case_id not in self._cases:
            self.put_case(query_case(self.query_func, case_id))

        try:
            return self._cases[case_id]
        except KeyError:
            raise Exception('could not find a case for case id [%s]' % case_id)

    def getIDsForValue(self, field_name, value):
        logging.debug('case index lookup %s %s' % (field_name, value))

        if (field_name, value) not in self.cached_lookups:
            if field_name == 'case-id':
                cases = [self.readCase(value)]
            else:
                get_val = {
                    'case-type': lambda c: c.getTypeId(),
                    'case-status': lambda c: 'closed' if c.isClosed() else 'open',
                }[field_name]

                cases = [c for c in self.cases.values() if get_val(c) == value]

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
                                     self.auth, self.vars.get("additional_filters", {}),
                                     self.vars.get("preload_cases", False)),
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
            exclude_keys = ['additional_filters', 'user_data']
            sess = CommCareSession(None) # will not passing a CCPlatform cause problems later?
            for k, v in self.vars.iteritems():
                if k not in meta_keys and k not in exclude_keys:
                    sess.setDatum(k, v)
            return from_bundle(sess.getSessionInstance(*([self.vars.get(k, '') for k in meta_keys] + \
                                                         [to_hashtable(self.vars.get('user_data', {}))])))
    
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
def handle_request (content, server):
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
        # whenever we do a filter case operation we need to load all
        # the cases, so force this unless manually specified
        if 'preload_cases' not in session_data:
            session_data['preload_cases'] = True
        ccInstances = CCInstances(session_data, api_auth)
        caseInstance = ExternalDataInstance("jr://instance/casedb", "casedb")
        caseInstance.initialize(ccInstances, "casedb")
        instances = to_hashtable({"casedb": caseInstance})
        case_list = XPathFuncExpr.toString(XPathParseTool.parseXPath(modified_xpath)\
            .eval(EvaluationContext(None, instances)))
        return {'cases': filter(lambda x: x,case_list.split(","))}
    except Exception, e:
        return {'status': 'error', 'message': str(e)}
