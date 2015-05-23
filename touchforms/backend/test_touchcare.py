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
        with open(os.path.join(CUR_DIR, 'test_files/xforms/xform_simple_cases.xml'), 'r') as f:
            self.xform = f.read()

        self.session_data = {
            'session_name': 'Village Healthe > Simple Form',
            'app_version': '2.0',
            'device_id': 'cloudcare',
            'user_id': '51cd680c0bd1c21bb5e63dab99748248',
            'additional_filters': {'footprint': True},
            'domain': 'aspace',
            'host': 'http://localhost:8000',
            'user_data': {},
            'case_id_new_RegCase_0': '1c2e7c76f0c84eaea5b44bc7d1d3caf0',
            'app_id': '6a48b8838d06febeeabb28c8c9516ab6',
            'username': 'ben'
        }

        self.case = {
            'case_id': 'legolas',
            'properties': {
                'case_type': 'dragon',
                'case_name': 'rocky',
                'date_opened': None,
                'owner_id': 'ben-123',
            },
            'closed': False,
            'indices': {},
            'attachments': {},
        }

    def test_filter_cases(self):
        filter_expr = "[case_name = 'rocky']"

        resp = touchcare.filter_cases(
            filter_expr,
            {},
            self.session_data,
            form_context={
                'cases': [self.case],
                'all_case_ids': ['legolas', 'gimli'],
                'case_model': self.case
            }
        )
        self.assertEqual(len(resp['cases']), 1)

    def test_mismatch_xpath(self):
        filter_expr = "broken"

        try:
            touchcare.filter_cases(
                filter_expr,
                {},
                self.session_data,
                form_context={
                    'cases': [self.case],
                    'all_case_ids': ['legolas', 'gimli'],
                    'case_model': self.case
                }
            )
        except TouchcareInvalidXPath, e:
            self.assertTrue(filter_expr in str(e))
        else:
            self.fail()

    def test_unauthenticated_query(self):
        try:
            touchcare.filter_cases(
                '',
                {},
                self.session_data,
            )
        except TouchFormsUnauthorized, e:
            self.assertTrue('Unable to connect to HQ' in str(e))
        else:
            self.fail()


if __name__ == '__main__':
    unittest.main()
