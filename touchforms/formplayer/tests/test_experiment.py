from django.test import SimpleTestCase
from touchforms.formplayer.experiments import formplayer_string_compare, formplayer_compare


class ExperimentTest(SimpleTestCase):

    control = {}
    candidate = {}

    def setup(self):
        self.reset()

    def testExperimentStringCompare(self):
        # session_id will never be equal, should be ignored
        self.assertTrue(formplayer_string_compare("123", "234", current_key="session_id"))
        # same with output XML (for the time being)
        self.assertTrue(formplayer_string_compare("123", "234", current_key="output"))

        self.assertTrue(formplayer_string_compare(0, "false", current_key="repeatable"))
        self.assertTrue(formplayer_string_compare(1, "true", current_key="repeatable"))
        self.assertTrue(not formplayer_string_compare(1, "false", current_key="repeatable"))
        self.assertTrue(formplayer_string_compare(0, "true", current_key="repeatable"))

    def testExperimentDictCompare(self):
        self.assertTrue(formplayer_compare(self.control, self.candidate))

        self.candidate['random_key'] = 'wrong_value'
        self.assertFalse(formplayer_compare(self.control, self.candidate))
        self.reset()

        self.candidate['repeatable'] = 'true'
        self.assertFalse(formplayer_compare(self.control, self.candidate))
        self.reset()

        # should fail if control has a key that the candidate does not
        self.control['extra_key'] = 'extra_value'
        self.assertFalse(formplayer_compare(self.control, self.candidate))
        self.reset()
        # allow candidate to have extra keys (Yes?)
        self.candidate['extra_key'] = 'extra_key'
        self.assertFalse(formplayer_compare(self.control, self.candidate))
        self.reset()

    def reset(self):
        self.control = {
            'session_id': 'session_id_control',
            'random_key': 'right_value',
            'repeatable': 0
        }
        self.candidate = {
            'session_id': 'session_id_candidate',
            'random_key': 'right_value',
            'repeatable': 'false'
        }