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
        with open(os.path.join(CUR_DIR, 'test_files/restores/simple_restore.xml'), 'r') as f:
            self.restore = f

    def test_filter_cases(self):
        filter_expr = "[case_name = 'case']"

        resp = touchcare.filter_cases(
                filter_expr,
                "wspride-tc",
                self.restore,
        )
        self.assertEqual(len(resp['cases']), 2)

if __name__ == '__main__':
    unittest.main()
