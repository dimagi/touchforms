import unittest
import touchcare


class CaseDBTest(unittest.TestCase):

    def setUp(self):
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

    def test_case_db_with_context(self):
        def mock_query(query_function, criteria):
            return []

        def mock_query_fail(query_function, criteria):
            self.fail()

        touchcare.query_case_ids = mock_query
        touchcare.query_case = mock_query_fail

        db = touchcare.CaseDatabase(
            'http://localhost/',
            'my-domain-name',
            {},
            form_context={
                'case_model': self.case
            },
        )
        case = db.read_object(self.case['case_id'])
        self.assertEqual(case.caseId, self.case['case_id'])


if __name__ == '__main__':
    unittest.main()
