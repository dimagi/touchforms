import os
import unittest
import xformplayer
import touchcare
from org.commcare.api.json import PromptToJson, AnswerQuestionJson
from org.json import JSONObject
from java.lang import RuntimeException

CUR_DIR = os.path.dirname(__file__)


class GUIStub(object):
    def __getattr__(self, name):
        return lambda _self: None


class FormPlayerApiTest(unittest.TestCase):

    def setUp(self):

        try:
            f = open(os.path.join(CUR_DIR, 'test_files/xforms/question_types.xml'), 'r')
            self.xform = f.read()
        except IOError:
            self.fail('Could not read test form')

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

        self.session_metadata = {
            'extensions': [],
            'session_data': self.session_data,
            'nav_mode': 'fao',
            'api_auth': {},
            'staleness_window': 1,
            'form_context': {
                'all_case_ids': ['legolas', 'sauron'],
                'case_model': self.case
            },
        }

        touchcare.perform_restore(
            {},
            self.session_data,
            restore_xml=self.restore,
        )


        xformplayer._init()
        self.manager = xformplayer.GlobalStateManager.get_globalstate()


    def test_form_loading(self):

        xform_session = xformplayer.XFormSession(
            self.xform,
            instance=None,
            **self.session_metadata
        )

        form_entry_model = xform_session.fem
        old = xform_session.next_event()
        while old:
            try:
                new = PromptToJson.formEntryModelToJson(form_entry_model)
                assert(self.compare_dict(old, new))
                old=xform_session.next_event()
            except RuntimeException:
                break

    def answer_assert(self, model, session, answer):
        session.answer_question(answer)
        old = session._parse_current_event()
        new = PromptToJson.formEntryModelToJson(model)
        print "Old:"
        print old
        print "New:"
        print new
        assert(self.compare_dict(old, new))

    def test_form_entry(self):

        xform_session = xformplayer.XFormSession(
            self.xform,
            instance=None,
            **self.session_metadata
        )

        model = xform_session.fem
        controller = xform_session.fec
        controller.stepToNextEvent()
        print "==="

        print AnswerQuestionJson.questionAnswerToJson(controller, model, "123")
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "ABC 123")
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "123")
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "123.123")
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "1970-10-23")
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "1970-10-23T12:30:30")
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "12:30:30")
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "william s pride")
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "12345")
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "000012345")
        print PromptToJson.formEntryModelToJson(model)
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "Will")
        print PromptToJson.formEntryModelToJson(model)


    def compare_dict(self, first, second):
        for key in first:
            if not second.has(key):
                print "Comparing: ", first, " : ", second
                print ("Second not has: ", key)
                return False
            if not self.json_equals(first.get(key), second.get(key)):
                print "Comparing key: ", key, ": ", first, " : ", second
                print "First key: ", key, ": ", first.get(key), " not equals second: ", second.get(key)
                print "Type First: ", type(first.get(key)), " type second: ", type(second.get(key))
                return False
        return True

    def compare_list(self, first, second):
        count = 0;
        for first_item in first:
            second_item = second.get(count)
            if not self.json_equals(first_item, second_item):
                print "JSON not equals: ", first_item, " : ", second_item
                return False
            count += 1
        return True


    def json_equals(self, first, second):
        if first == None:
            return second is JSONObject.NULL
        if isinstance(first, dict):
            return self.compare_dict(first, second)
        if isinstance(first, list):
            return self.compare_list(first, second)
        if isinstance(first, xformplayer.choice):
            #TODO WSP: How to represent choices?
            return first.__repr__() == second
        return first == second


if __name__ == '__main__':
    unittest.main()
