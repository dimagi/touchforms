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

    def load_xform(self, path):
        f = open(os.path.join(CUR_DIR, path), 'r')
        return f.read()

    def setUp(self):

        try:
            self.xform = self.load_xform('test_files/xforms/question_types.xml')
            self.group_xform = self.load_xform('test_files/xforms/groups.xml')
            self.repeat_xform = self.load_xform( 'test_files/xforms/repeat.xml')
            self.nested_xform = self.load_xform('test_files/xforms/nested.xml')
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

        xformplayer._init()
        self.manager = xformplayer.GlobalStateManager.get_globalstate()

    def test_repeat_walking(self):

        def answer_assert(answer, index):
            new_xform_session.answer_question(answer, index)
            old_xform_session.answer_question(answer, index)
            assert(json_equals(old_xform_session.walk(), new_xform_session.walk()))

        old_xform_session = xformplayer.XFormSession(
            self.repeat_xform,
            instance=None,
            **self.session_metadata
        )

        new_xform_session = xformplayer.NewXFormSession(
            self.repeat_xform,
            instance=None,
            **self.session_metadata
        )

        assert(old_xform_session.walk(), new_xform_session.walk())

        answer_assert("1", "4:0,1:0,0")
        answer_assert("2", "4:0,1:1,0")
        answer_assert("3", "4:0,1:2,0")
        answer_assert("4", "4:1,1:0,0")
        answer_assert("5", "4:1,1:1,0")
        answer_assert("6", "4:1,1:2,0")
        answer_assert("5", "5")
        answer_assert("1", "5")
        answer_assert("2", "5")
        answer_assert("Will", "7:0,0")
        answer_assert("Rules", "7:1,0")


    def test_group_walking(self):

        old_xform_session = xformplayer.XFormSession(
            self.group_xform,
            instance=None,
            **self.session_metadata
        )

        new_xform_session = xformplayer.NewXFormSession(
            self.group_xform,
            instance=None,
            **self.session_metadata
        )

        model = new_xform_session.fem
        controller = new_xform_session.fec

        def answer_assert(answer, index):
            new_xform_session.answer_question(answer, index)
            old_xform_session.answer_question(answer, index)
            assert(json_equals(old_xform_session.walk(), new_xform_session.walk()))

        assert(json_equals(old_xform_session.walk(), json.loads(WalkJson.walkToJson(model, controller))))

        answer_assert("1", "1,1")
        answer_assert("William", "1,4")
        answer_assert("1", "3")
        answer_assert("2", "5")
        answer_assert("2", "5")
        answer_assert("2", "3")
        answer_assert("1", "5")

    def test_nested_walking(self):

        xform_session = xformplayer.NewXFormSession(
            self.nested_xform,
            instance=None,
            **self.session_metadata
        )

        model = xform_session.fem
        controller = xform_session.fec

        assert(json_equals(xform_session.walk(), json.loads(WalkJson.walkToJson(model, controller))))

    def test_form_answering(self):
        old_xform_session = xformplayer.XFormSession(
            self.xform,
            instance=None,
            **self.session_metadata
        )

        new_xform_session = xformplayer.NewXFormSession(
            self.xform,
            instance=None,
            **self.session_metadata
        )

        def answer_assert(answer, index):
            new_answer = new_xform_session.answer_question(answer, index)
            old_answer = old_xform_session.answer_question(answer, index)
            assert(json_equals(old_answer, new_answer))
            assert(json_equals(old_xform_session.walk(), new_xform_session.walk()))


        answer_assert("123 ABC", "1")
        answer_assert("123", "2")
        answer_assert("2.5", "3")
        answer_assert("1970-10-23", "4")
        #answer_assert("1970-10-23T12:30:30", "5") datetime not supported
        answer_assert("12:30:30", "6")
        answer_assert("william s pride", "7")
        answer_assert("12345", "8")
        answer_assert("00012345", "9")
        answer_assert("2", "10")
        answer_assert("1 2 3", "11")


def compare_dict(first, second):
    for key in first:
        if not key in second:
            print "Comparing KEY: ", key
            print "First: ", first
            print "===="
            print "Second: ", second
            print ("Second not has: ", key)
            return False
        if not json_equals(first.get(key), second.get(key)):
            print "Comparing KEY: ", key
            print "First: ", first.get(key)
            print "===="
            print "Second: ", second.get(key)
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
