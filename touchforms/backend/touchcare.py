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
from org.commcare.cases.ledger.instance import LedgerInstanceTreeElement
from org.commcare.cases.model import Case
from org.commcare.cases.ledger import Ledger
from org.commcare.util import CommCareSession
from org.commcare.xml import TreeElementParser

from org.javarosa.xpath.expr import XPathFuncExpr
from org.javarosa.xpath import XPathParseTool
from org.javarosa.core.model.condition import EvaluationContext
from org.javarosa.core.model.instance import ExternalDataInstance

from org.kxml2.io import KXmlParser

from util import to_vect, to_jdate, to_hashtable, to_input_stream, query_factory

logger = logging.getLogger('formplayer.touchcare')


def query_case_ids(q, criteria=None):
    criteria = copy(criteria) or {} # don't modify the passed in dict
    criteria["ids_only"] = 'true'
    query_url = '%s?%s' % (settings.CASE_API_URL, urllib.urlencode(criteria))
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

    for k, v in data['attachments'].iteritems():
        c.updateAttachment(k, v['url'])

    return c


def query_ledger_for_case(q, case_id):
    query_string = urllib.urlencode({'case_id': case_id})
    query_url = '%s?%s' % (settings.LEDGER_API_URL, query_string)
    return ledger_from_json(q(query_url))


def ledger_from_json(data):
    ledger = Ledger(data['entity_id'])
    for section_id, section in data['ledger'].items():
        for product_id, amount in section.items():
            ledger.setEntry(section_id, product_id, int(amount))
    return ledger


class StaticIterator(IStorageIterator):
    def __init__(self, ids):
        self.ids = ids
        self.i = 0

    def hasMore(self):
        return self.i < len(self.ids)

    def nextID(self):
        id = self.ids[self.i]
        self.i += 1
        return id


class TouchformsStorageUtility(IStorageUtilityIndexed):

    def __init__(self, host, domain, auth, additional_filters=None, preload=False):
        self.cached_lookups = {}
        self._objects = {}
        self.ids = {}
        self.fully_loaded = False  # when we've loaded every possible object
        self.query_func = query_factory(host, domain, auth)
        self.additional_filters = additional_filters or {}
        if preload:
            self.load_all_objects()
        else:
            self.load_object_ids()

    def get_object_id(self, object):
        raise NotImplementedError("subclasses must handle this")

    def fetch_object(self, object_id):
        raise NotImplementedError("subclasses must handle this")

    def load_all_objects(self):
        raise NotImplementedError("subclasses must handle this")

    def load_object_ids(self):
        raise NotImplementedError("subclasses must handle this")

    @property
    def objects(self):
        if self.fully_loaded:
            return self._objects
        else:
            self.load_all_objects()
        return self._objects

    def put_object(self, object):
        object_id = self.get_object_id(object)
        self._objects[object_id] = object

    def read(self, record_id):
        logger.debug('read record %s' % record_id)
        try:
            # record_id is an int, object_id is a guid
            object_id = self.ids[record_id]
        except KeyError:
            return None
        return self.read_object(object_id)

    def read_object(self, object_id):
        logger.debug('read object %s' % object_id)
        if object_id not in self._objects:
            self.put_object(self.fetch_object(object_id))
        try:
            return self._objects[object_id]
        except KeyError:
            raise Exception('could not find an object for id [%s]' % object_id)

    def setReadOnly(self):
        # todo: not sure why this exists. is it part of the public javarosa API?
        pass

    def getNumRecords(self):
        return len(self.ids)

    def iterate(self):
        return StaticIterator(self.ids.keys())


class CaseDatabase(TouchformsStorageUtility):
    def __init__(self, host, domain, user, auth, additional_filters=None,
                 preload=False):
        super(CaseDatabase, self).__init__(host, domain, auth, additional_filters, preload)

    def get_object_id(self, case):
        return case.getCaseId()

    def fetch_object(self, case_id):
        return query_case(self.query_func, case_id)

    def load_all_objects(self):
        cases = query_cases(self.query_func,
                            criteria=self.additional_filters)
        for c in cases:
            self.put_object(c)
        self.ids = dict(enumerate(self._objects.keys()))
        self.fully_loaded = True

    def load_object_ids(self):
        case_ids = query_case_ids(self.query_func, criteria=self.additional_filters)
        self.ids = dict(enumerate(case_ids))

    def getIDsForValue(self, field_name, value):
        logger.debug('case index lookup %s %s' % (field_name, value))

        if (field_name, value) not in self.cached_lookups:
            if field_name == 'case-id':
                cases = [self.read_object(value)]
            else:
                try:
                    get_val = {
                        'case-type': lambda c: c.getTypeId(),
                        'case-status': lambda c: 'closed' if c.isClosed() else 'open',
                    }[field_name]
                except KeyError:
                    # Try any unrecognized field name as a case id field.
                    # Needed for 'case-in-goal' lookup in PACT Care Plan app.
                    cases = [self.read_object(value)]
                else:
                    cases = [c for c in self.objects.values() if get_val(c) == value]

            self.cached_lookups[(field_name, value)] = cases

        cases = self.cached_lookups[(field_name, value)]
        id_map = dict((v, k) for k, v in self.ids.iteritems())
        return to_vect(id_map[c.getCaseId()] for c in cases)


class LedgerDatabase(TouchformsStorageUtility):
    def __init__(self, host, domain, auth, additional_filters, preload):
        super(LedgerDatabase, self).__init__(host, domain, auth, additional_filters, preload)

    def get_object_id(self, ledger):
        return ledger.getEntiyId()

    def fetch_object(self, entity_id):
        return query_ledger_for_case(self.query_func, entity_id)

    def load_object_ids(self):
        case_ids = query_case_ids(self.query_func, criteria=self.additional_filters)
        self.ids = dict(enumerate(case_ids))

    def getIDsForValue(self, field_name, value):
        logger.debug('ledger lookup %s %s' % (field_name, value))
        if (field_name, value) not in self.cached_lookups:
            if field_name == 'entity-id':
                ledgers = [self.read_object(value)]
            else:
                raise NotImplementedError("Only entity-id lookup is currently supported!")

            self.cached_lookups[(field_name, value)] = ledgers

        else:
            ledgers = self.cached_lookups[(field_name, value)]

        id_map = dict((v, k) for k, v in self.ids.iteritems())
        return to_vect(id_map[l.getEntiyId()] for l in ledgers)


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
                        CaseDatabase(self.vars.get('host'), self.vars['domain'], self.vars['user_id'], 
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
        elif 'ledgerdb' in ref:
            return LedgerInstanceTreeElement(
                instance.getBase(),
                LedgerDatabase(
                    self.vars.get('host'), self.vars['domain'],
                    self.auth, self.vars.get("additional_filters", {}),
                    self.vars.get("preload_cases", False),
                )
            )

        elif 'session' in ref:
            meta_keys = ['device_id', 'app_version', 'username', 'user_id']
            exclude_keys = ['additional_filters', 'user_data']
            sess = CommCareSession(None) # will not passing a CCPlatform cause problems later?
            for k, v in self.vars.iteritems():
                if k not in meta_keys and k not in exclude_keys:
                    # com.xhaus.jyson.JysonCodec returns data as byte strings
                    # in unknown encoding (possibly ISO-8859-1)
                    sess.setDatum(k, unicode(v, errors='replace'))
            return from_bundle(sess.getSessionInstance(*([self.vars.get(k, '') for k in meta_keys] + \
                                                         [to_hashtable(self.vars.get('user_data', {}))])))
    
    def _get_fixture(self, user_id, fixture_id):
        query_url = '%(base)s/%(user)s/%(fixture)s' % { "base": settings.FIXTURE_API_URL, 
                                                        "user": user_id,
                                                        "fixture": fixture_id }
        q = query_factory(self.vars.get('host'), self.vars['domain'], self.auth, format="raw")
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

        # load any additional instances needed
        for extra_instance_config in session_data.get('extra_instances', []):
            data_instance = ExternalDataInstance(extra_instance_config['src'], extra_instance_config['id'])
            data_instance.initialize(ccInstances, extra_instance_config['id'])
            instances[extra_instance_config['id']] = data_instance

        case_list = XPathFuncExpr.toString(
            XPathParseTool.parseXPath(modified_xpath).eval(
                EvaluationContext(None, instances)))
        return {'cases': filter(lambda x: x,case_list.split(","))}
    except Exception, e:
        return {'status': 'error', 'message': str(e)}
