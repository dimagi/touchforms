from django.test import SimpleTestCase
from touchforms.formplayer.experiments import formplayer_string_compare, formplayer_compare

class ExperimentTest(SimpleTestCase):

    def setup(self):
        self.resetDicts()

    def testExperimentStringCompare(self):
        # session_id will never be equal, should be ignored
        self.assertTrue(formplayer_string_compare("123", "234", key="session_id"))
        # same with output XML (for the time being)
        self.assertTrue(formplayer_string_compare("123", "234", key="output"))

        self.assertTrue(formplayer_string_compare(0, "false", key="repeatable"))
        self.assertTrue(formplayer_string_compare(1, "true", key="repeatable"))
        self.assertFalse(formplayer_string_compare(1, "false", key="repeatable"))
        self.assertFalse(formplayer_string_compare(0, "true", key="repeatable"))

    def testExperimentDictCompare(self):
        (control, candidate) = self.resetDicts()
        self.assertTrue(formplayer_compare(control, candidate))
        candidate['random_key'] = 'wrong_value'
        self.assertFalse(formplayer_compare(control, candidate))

        (control, candidate) = self.resetDicts()

        candidate['repeatable'] = 'true'
        self.assertFalse(formplayer_compare(control, candidate))

        (control, candidate) = self.resetDicts()
        # should fail if control has a key that the candidate does not
        control['extra_key'] = 'extra_value'
        self.assertFalse(formplayer_compare(control, candidate))

        (control, candidate) = self.resetDicts()
        # allow candidate to have extra keys (Yes?)
        candidate['extra_key'] = 'extra_key'
        self.assertTrue(formplayer_compare(control, candidate))

        (control, candidate) = self.resetDicts()
        candidate = candidate.pop('session_id')
        self.assertFalse(formplayer_compare(control, candidate))

    def resetDicts(self):
        control = {
            'session_id': 'session_id_control',
            'random_key': 'right_value',
            'repeatable': 0
        }
        candidate = {
            'session_id': 'session_id_candidate',
            'random_key': 'right_value',
            'repeatable': 'false'
        }
        return (control, candidate)