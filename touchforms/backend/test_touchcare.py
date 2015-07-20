from __future__ import with_statement
import unittest
import os

from setup import init_classpath
init_classpath()

import touchcare
from xcp import TouchcareInvalidXPath, TouchFormsUnauthorized

CUR_DIR = os.path.dirname(__file__)


class TouchcareTest(unittest.TestCase):

    def setUp(self):
        self.restore = os.path.join(CUR_DIR, 'test_files/restores/simple_restore.xml')
        self.session_data = {
            'session_name': 'Village Healthe > Simple Form',
            'app_version': '2.0',
            'device_id': 'cloudcare',
            'user_id': '51cd680c0bd1c21bb5e63dab99748248',
            'additional_filters': {'footprint': True},
            'domain': 'willslearningproject',
            'host': 'http://localhost:8000',
            'user_data': {},
            'case_id_new_RegCase_0': '1c2e7c76f0c84eaea5b44bc7d1d3caf0',
            'app_id': '6a48b8838d06febeeabb28c8c9516ab6',
            'username': 'wspride-tc-2'
        }

    def test_filter_cases(self):
        filter_expr = "[case_name = 'case']"

        resp = touchcare.filter_cases(
                filter_expr,
                {},
                self.session_data,
                restore=self.restore,
        )
        self.assertEqual(len(resp['cases']), 2)
        print "cases: ", resp['cases']

    def test_filter_cases_two(self):
        filter_expr = "[case_name = 'derp']"

        resp = touchcare.filter_cases(
                filter_expr,
                {},
                self.session_data,
                restore=self.restore,
                needs_sync=False,
        )
        self.assertEqual(len(resp['cases']), 0)
        print "cases: ", resp['cases']

    def test_filter_cases_3(self):
        filter_expr = "[case_name = 'case']"

        resp = touchcare.filter_cases(
                filter_expr,
                {},
                self.session_data,
                restore=self.restore,
                needs_sync=False,
        )
        self.assertEqual(len(resp['cases']), 2)
        print "cases: ", resp['cases']

class TouchcareLedgerTest(unittest.TestCase):

    def setUp(self):
        self.restore = os.path.join(CUR_DIR, 'test_files/restores/ipm_restore.xml')
        self.session_data = {
            'session_name': 'Village Healthe > Simple Form',
            'app_version': '2.0',
            'device_id': 'cloudcare',
            'user_id': 'a8f5a98c4ce767c35b9132bc75eb225c',
            'additional_filters': {'footprint': True},
            'domain': 'willslearningproject',
            'host': 'http://localhost:8000',
            'user_data': {},
            'case_id_new_RegCase_0': '1c2e7c76f0c84eaea5b44bc7d1d3caf0',
            'app_id': '6a48b8838d06febeeabb28c8c9516ab6',
            'username': 'ipm-test'
        }

    def test_filter_cases(self):
        filter_expr = "[case_name = 'Napoli']"

        resp = touchcare.filter_cases(
            filter_expr,
            {},
            self.session_data,
            restore=self.restore,
        )
        self.assertEqual(len(resp['cases']), 1)
        print "cases: ", resp['cases']

    def test_filter_cases_two(self):
        filter_expr = "[case_name = 'derp']"

        resp = touchcare.filter_cases(
            filter_expr,
            {},
            self.session_data,
            restore=self.restore,
        )
        self.assertEqual(len(resp['cases']), 0)
        print "cases: ", resp['cases']

    def test_get_fixtures(self):
        filter_expr = "[name = 'Collier']"
        resp = touchcare.get_fixtures(
            filter_expr,
            {},
            self.session_data,
            restore=self.restore,
        )
        print "Resp: ", resp

class TouchcareRestoreTest(unittest.TestCase):

    def setUp(self):
        self.session_data = {
            'session_name': 'Village Healthe > Simple Form',
            'app_version': '2.0',
            'device_id': 'cloudcare',
            'user_id': '51cd680c0bd1c21bb5e63dab99748248',
            'additional_filters': {'footprint': True},
            'domain': 'willslearningproject',
            'host': 'http://localhost:8000',
            'user_data': {},
            'case_id_new_RegCase_0': '1c2e7c76f0c84eaea5b44bc7d1d3caf0',
            'app_id': '6a48b8838d06febeeabb28c8c9516ab6',
            'username': 'will'
        }

    def test_filter_cases(self):
        filter_expr = "[case_name = 'derp']"

        auth = {'type': 'http-digest',
                'username': 'will@willslearningproject.commcarehq.org',
                'key': '123'}

        resp = touchcare.filter_cases(
            filter_expr,
            auth=auth,
            session_data=self.session_data,
            needs_sync=True,
        )
        self.assertEqual(len(resp['cases']), 1)
        print "cases: ", resp['cases']

if __name__ == '__main__':
    unittest.main()
