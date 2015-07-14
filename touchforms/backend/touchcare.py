import urllib
from urllib2 import HTTPError, URLError
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
from org.javarosa.xml import TreeElementParser

from org.javarosa.xpath.expr import XPathFuncExpr
from org.javarosa.xpath import XPathParseTool, XPathException
from org.javarosa.xpath.parser import XPathSyntaxException
from org.javarosa.core.model.condition import EvaluationContext
from org.javarosa.core.model.instance import ExternalDataInstance
from org.commcare.api.util import UserDataUtils
from java.io import FileInputStream, File
from org.kxml2.io import KXmlParser

from util import to_vect, to_jdate, to_hashtable, to_input_stream, query_factory
from xcp import TouchFormsUnauthorized, TouchcareInvalidXPath, CaseNotFound

logger = logging.getLogger('formplayer.touchcare')


def get_restore_url(criteria=None):
    query_url = '%s?%s' % (settings.RESTORE_URL, urllib.urlencode(criteria))
    return query_url


class CCInstances(InstanceInitializationFactory):

    def __init__(self, sessionvars, auth, restore=None, needs_sync=False):
        self.vars = sessionvars
        self.username = sessionvars['username']
        self.auth = auth
        self.sandbox = UserDataUtils.getStaticStorage(self.username)
        self.host = sessionvars['host']
        self.domain = sessionvars['domain']
        self.query_func = query_factory(self.host, self.domain, self.auth, 'raw')
        self.query_url = get_restore_url({'as': self.username + '@' + self.domain, 'version': '2.0'})

        if needs_sync:
            self.perform_ota_restore(restore)

    def perform_ota_restore(self, restore=None):

        if not restore:
            restore_xml = self.get_restore_xml()
            text_file = open("restore.xml", "w")
            text_file.write(restore_xml)
            text_file.close()
            restore_file = "restore.xml"
        else:
            restore_file = restore

        input_stream = FileInputStream(restore_file)
        UserDataUtils.parseIntoSandbox(input_stream, self.sandbox)

    def get_restore_xml(self):
        payload = self.query_func(self.query_url)
        return payload


    def generateRoot(self, instance):
        ref = instance.getReference()
        def from_bundle(inst):
            root = inst.getRoot()
            root.setParent(instance.getBase())
            return root

        if 'casedb' in ref:
            return CaseInstanceTreeElement(
                instance.getBase(),
                self.sandbox.getCaseStorage(),
                False
            )
        elif 'fixture' in ref:
            fixture_id = ref.split('/')[-1]
            user_id = self.vars['user_id']
            print "Userid: ", user_id, " fixture id: ", fixture_id
            fixture = UserDataUtils.loadFixture(self.sandbox, fixture_id, user_id)
            root = fixture.getRoot()
            root.setParent(instance.getBase())
            return root
        elif 'ledgerdb' in ref:
            return LedgerInstanceTreeElement(
                instance.getBase(),
                self.sandbox.getLedgerStorage()
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

            clean_user_data = {}
            for k, v in self.vars.get('user_data', {}).iteritems():
                clean_user_data[k] = unicode(v if v is not None else '', errors='replace')

            return from_bundle(sess.getSessionInstance(*([self.vars.get(k, '') for k in meta_keys] + \
                                                         [to_hashtable(clean_user_data)])))


def filter_cases(filter_expr, auth, session_data=None, restore=None):
    modified_xpath = "join(',', instance('casedb')/casedb/case%(filters)s/@case_id)" % \
        {"filters": filter_expr}

    ccInstances = CCInstances(session_data, auth, restore)
    caseInstance = ExternalDataInstance("jr://instance/casedb", "casedb")

    try:
        caseInstance.initialize(ccInstances, "casedb")
    except (HTTPError, URLError), e:
        raise TouchFormsUnauthorized('Unable to connect to HQ: %s' % str(e))

    instances = to_hashtable({"casedb": caseInstance})

    try:
        case_list = XPathFuncExpr.toString(
            XPathParseTool.parseXPath(modified_xpath).eval(
                EvaluationContext(None, instances)))
        return {'cases': filter(lambda x: x, case_list.split(","))}
    except (XPathException, XPathSyntaxException), e:
        raise TouchcareInvalidXPath('Error querying cases with xpath %s: %s' % (filter_expr, str(e)))


def get_fixtures(filter_expr, auth, session_data=None, restore=None):

    modified_xpath = "join(',', instance('products')/products/product%(filters)s/@id)" % \
        {"filters": filter_expr}

    ccInstances = CCInstances(session_data, auth, restore)
    productsInstance = ExternalDataInstance("jr://instance/fixture/commtrack:products", "products")

    try:
        productsInstance.initialize(ccInstances, "products")
    except (HTTPError, URLError), e:
        raise TouchFormsUnauthorized('Unable to connect to HQ: %s' % str(e))

    instances = to_hashtable({"products": productsInstance})

    try:
        fixture_name = XPathFuncExpr.toString(
            XPathParseTool.parseXPath(modified_xpath).eval(
                EvaluationContext(None, instances)))
        print "Fixture Name: ", fixture_name
    except (XPathException, XPathSyntaxException), e:
        raise TouchcareInvalidXPath('Error querying cases with xpath %s: %s' % (modified_xpath, str(e)))


class Actions:
    FILTER_CASES = 'touchcare-filter-cases'
