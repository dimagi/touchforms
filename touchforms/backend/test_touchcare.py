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
            restore_xml=self.restore,
        )
        self.assertEqual(len(resp['cases']), 2)
        print "cases: ", resp['cases']

    def test_filter_cases_two(self):
        filter_expr = "[case_name = 'derp']"

        resp = touchcare.filter_cases(
            filter_expr,
            {},
            self.session_data,
            restore_xml=self.restore,
            force_sync=False,
        )
        self.assertEqual(len(resp['cases']), 0)
        print "cases: ", resp['cases']

    def test_filter_cases_3(self):
        filter_expr = "[case_name = 'case']"

        resp = touchcare.filter_cases(
            filter_expr,
            {},
            self.session_data,
            restore_xml=self.restore,
            force_sync=False,
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
            'username': 'ipm-test-2'
        }

    def test_filter_cases(self):
        filter_expr = "[case_name = 'Napoli']"

        resp = touchcare.filter_cases(
            filter_expr,
            {},
            self.session_data,
            restore_xml=self.restore,
        )
        self.assertEqual(len(resp['cases']), 1)
        print "cases: ", resp['cases']

    def test_filter_cases_two(self):
        filter_expr = "[case_name = 'derp']"

        resp = touchcare.filter_cases(
            filter_expr,
            {},
            self.session_data,
            restore_xml=self.restore,
        )
        self.assertEqual(len(resp['cases']), 0)
        print "cases: ", resp['cases']


class SubmissionTest(unittest.TestCase):

    def setUp(self):
        self.form = os.path.join(CUR_DIR, 'test_files/simple_submission.xml')
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
            'username': 'submission-test'
        }

        self.filter_expr = "[case_name = 'Napoli']"

    def test_submission(self):
        touchcare.perform_restore(
            {},
            self.session_data,
            restore_xml=self.restore,
        )

        touchcare.process_form_file(
            {},
            self.form,
            self.session_data,
        )
        filter_expr = "[@case_id = 'submission_id']"
        resp = touchcare.filter_cases(
            filter_expr,
            {},
            session_data=self.session_data,
            force_sync=False,
        )
        self.assertEqual(len(resp['cases']), 1)

if __name__ == '__main__':
    unittest.main()
