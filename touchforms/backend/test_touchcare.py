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

    def test_filter_cases(self):
        filter_expr = "[case_name = 'case']"

        resp = touchcare.filter_cases(
                filter_expr,
                "wspride-tc",
                self.restore,
        )
        self.assertEqual(len(resp['cases']), 2)
        print "cases: ", resp['cases']

    def test_filter_cases_two(self):
        filter_expr = "[case_name = 'derp']"

        resp = touchcare.filter_cases(
                filter_expr,
                "wspride-tc",
                self.restore,
        )
        self.assertEqual(len(resp['cases']), 0)
        print "cases: ", resp['cases']

class TouchcareLedgerTest(unittest.TestCase):

    def setUp(self):
        self.restore = os.path.join(CUR_DIR, 'test_files/restores/ipm_restore.xml')

    def test_filter_cases(self):
        filter_expr = "[case_name = 'Napoli']"

        resp = touchcare.filter_cases(
                filter_expr,
                "ipm-tc",
                self.restore,
        )
        self.assertEqual(len(resp['cases']), 1)
        print "cases: ", resp['cases']

    def test_filter_cases_two(self):
        filter_expr = "[case_name = 'derp']"

        resp = touchcare.filter_cases(
                filter_expr,
                "wspride-tc",
                self.restore,
        )
        self.assertEqual(len(resp['cases']), 0)
        print "cases: ", resp['cases']

if __name__ == '__main__':
    unittest.main()
