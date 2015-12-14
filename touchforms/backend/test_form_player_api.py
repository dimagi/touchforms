import os
import unittest
import xformplayer
import touchcare
from datetime import datetime, time
from org.commcare.api.json import PromptToJson, AnswerQuestionJson, InstanceXmlUtil, WalkJson
from java.lang import RuntimeException
import com.xhaus.jyson.JysonCodec as json
from org.javarosa.core.model import FormIndex

CUR_DIR = os.path.dirname(__file__)


class GUIStub(object):
    def __getattr__(self, name):
        return lambda _self: None


class FormPlayerApiTest(unittest.TestCase):

    def setUp(self):

        try:
            f = open(os.path.join(CUR_DIR, 'test_files/xforms/question_types.xml'), 'r')
            self.xform = f.read()
            f = open(os.path.join(CUR_DIR, 'test_files/xforms/groups.xml'), 'r')
            self.group_xform = f.read()
            f = open(os.path.join(CUR_DIR, 'test_files/xforms/repeat.xml'), 'r')
            self.repeat_xform = f.read()
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

        self.commcare_instance = touchcare.perform_restore(
            {},
            self.session_data,
            restore_xml=self.restore,
        )


        xformplayer._init()
        self.manager = xformplayer.GlobalStateManager.get_globalstate()

    def test_form_walking(self):

        xform_session = xformplayer.XFormSession(
            self.xform,
            instance=None,
            **self.session_metadata
        )

        model = xform_session.fem
        controller = xform_session.fec

        assert(json_equals(xform_session.walk(), json.loads(WalkJson.walkToJson(model, controller))))

    def test_group_walking(self):

        xform_session = xformplayer.XFormSession(
            self.repeat_xform,
            instance=None,
            **self.session_metadata
        )

        model = xform_session.fem
        controller = xform_session.fec

        print "==== WALK ===="
        print WalkJson.walkToJson(model, controller)
        print "==== OLD WALK ===="
        print xform_session.walk()

        assert(json_equals(xform_session.walk(), json.loads(WalkJson.walkToJson(model, controller))))


    def test_form_entry(self):

        xform_session = xformplayer.XFormSession(
            self.xform,
            instance=None,
            **self.session_metadata
        )

        model = xform_session.fem
        controller = xform_session.fec

        def assert_json_equal():
            old = xform_session._parse_current_event()
            new = json.loads(PromptToJson.parseQuestionToString(model))
            assert(compare_dict(old, new))

        controller.stepToNextEvent()
        print "==="
        AnswerQuestionJson.questionAnswerToJson(controller, model, "123")
        assert_json_equal()
        controller.stepToNextEvent()
        print "==="
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "ABC 123")
        assert_json_equal()
        controller.stepToNextEvent()
        print "==="
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "123")
        assert_json_equal()
        controller.stepToNextEvent()
        print "==="
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "123.123")
        assert_json_equal()
        controller.stepToNextEvent()
        print "==="
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "1970-10-23")
        assert_json_equal()
        controller.stepToNextEvent()
        print "==="
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "1970-10-23T12:30:30")
        assert_json_equal()
        controller.stepToNextEvent()
        print "==="
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "12:30:30")
        assert_json_equal()
        controller.stepToNextEvent()
        print "==="
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "william s pride")
        assert_json_equal()
        controller.stepToNextEvent()
        print "==="
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "12345")
        assert_json_equal()
        controller.stepToNextEvent()
        print "==="
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "000012345")
        assert_json_equal()
        controller.stepToNextEvent()
        print "==="
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "two")
        assert_json_equal()
        controller.stepToNextEvent()
        print "==="
        print AnswerQuestionJson.questionAnswerToJson(controller, model, "one two three")
        assert_json_equal()
        controller.stepToNextEvent()


def compare_dict(first, second):
    for key in first:
        if not key in second:
            print "Comparing: ", first, " : ", second
            print ("Second not has: ", key)
            return False
        if not json_equals(first.get(key), second.get(key)):
            print "Comparing key: ", key, ": ", first, " : ", second
            print "First key: ", key, ": ", first.get(key), " not equals second: ", second.get(key)
            print "Type First: ", type(first.get(key)), " type second: ", type(second.get(key))
            return False
    return True

def compare_list(first, second):
    count = 0;
    for first_item in first:
        second_item = second[count]
        if not json_equals(first_item, second_item):
            print "JSON not equals: ", first_item, " SECOND ", second_item
            return False
        count += 1
    return True


def json_equals(first, second):
    if isinstance(first, dict):
        return compare_dict(first, second)
    if isinstance(first, list):
        return compare_list(first, second)
    if isinstance(first, FormIndex):
        return first.toString() == second
    if isinstance(first, xformplayer.choice):
        #TODO WSP: How to represent choices?
        return first.__repr__() == second
    if isinstance(first, datetime):
        return first == datetime.fromtimestamp(second)
    if isinstance(first, time):
        return first == datetime.strptime(second, "%H:%M").time()

    return first == second


if __name__ == '__main__':
    unittest.main()
