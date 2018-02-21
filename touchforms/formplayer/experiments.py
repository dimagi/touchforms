import laboratory
import json
import logging
from dimagi.utils.couch.cache.cache_core import get_redis_client

diff_logger = logging.getLogger('formplayer_diff')
timing_logger = logging.getLogger('formplayer_timing')


class FormplayerExperiment(laboratory.Experiment):

    def publish(self, result):

        control = result.control

        if len(result.observations) == 0:
            logging.info('No candidate experiment for control %s' % control)
            return

        candidate = result.observations[0]

        if not candidate:
            logging.info('Empty candidate %s for control %s' %(candidate, control))
            self.log_diff(control, candidate)
            return

        # if we're starting a new form, we need to store the mapping between session_ids so we can use later
        if self.name == "new-form":
            cache = get_redis_client()
            control_dict = json.loads(result.control.value)
            try:
                candidate_dict = json.loads(candidate.value)
            except Exception as e:
                logging.info('Exception %s processing candidate %s for control %s' %(e, candidate, control))
                self.log_diff(control_dict, candidate)
                return
            control_session_id = control_dict["session_id"]
            candidate_session_id = candidate_dict["session_id"]
            cache.set('touchforms-to-formplayer-session-id-%s' % control_session_id, candidate_session_id)
            cache.expire('touchforms-to-formplayer-session-id-%s' % control_session_id, 7 * 24 * 60 * 60)

        # We're only ever returning one of these (I think)

        self.log_timing(control, candidate)
        if candidate:
            control_value = json.loads(result.control.value)
            candidate_value = json.loads(candidate.value)
            if not formplayer_compare(control_value, candidate_value):
                logging.info('diff between control %s and candidate %s' %(control_value, candidate_value))
                self.log_diff(control_value, candidate_value)
        else:
            logging.info('Empty control %s for candidate %s' %(control, candidate))
            self.log_diff(control, candidate)

    def log_diff(self, control_value, candidate_value):
        request = self.context['request']
        action = request['action']
        diff_logger.info(
            "MSG",
            extra={
                'action': action,
                'request': request,
                'control': control_value,
                'candidate': candidate_value
            })

    def log_timing(self, control, candidate):
        timing_logger.info(
            "MSG",
            extra={
                'action': self.name,
                'control_duration': control.duration,
                'candidate_duration': candidate.duration
            })


def compare_list(control, candidate):
    is_equal = True
    if len(control) != len(candidate):
        logging.info("Length of control %s is different than candidate %s" % (control, candidate))
        is_equal = False
    for first_item, second_item in zip(control, candidate):
        if not formplayer_compare(first_item, second_item):
            is_equal = False
    return is_equal


def compare_dict(control, candidate):
    is_equal = True
    for key in control:
        if check_skip_key(key):
            continue
        if key not in candidate:
            logging.info('Key %s in control %s but not candidate %s' % (key, control, candidate))
            is_equal = False
        if check_skip_content(key):
            continue
        if not formplayer_compare(control.get(key), candidate.get(key), key):
            is_equal = False
    return is_equal


def formplayer_compare(control, candidate, key=None):
    if isinstance(control, dict):
        if not(isinstance(candidate, dict)):
            logging.info('For key %s: Candidate %s is not a dict, but control %s is' % (key, candidate, control))
            return False
        return compare_dict(control, candidate)
    elif isinstance(control, list):
        if not(isinstance(candidate, list)):
            logging.info('For key %s: Candidate %s is not a list, but control %s is' % (key, candidate,
                                                                                        control))
            return False
        return compare_list(control, candidate)
    else:
        return formplayer_string_compare(control, candidate, key)


## Mappings between what Formplayer and Touchforms can safely disagree on
def formplayer_string_compare(control, candidate, key=None):

    if check_skip_key(key) or check_skip_content(key):
        return True

    if key == "repeatable":
        # These end up as 0 and 1 in python world, despite being set to True and False in xformplayer.py
        if control == 0:
            ret = candidate == "false"
        elif control == 1:
            ret = candidate == "true"
        else:
            ret = control == candidate
    else:
        ret = control == candidate
    if not ret:
        logging.info("Mismatch with key %s between control %s and candidate %s"
                     % (key, control, candidate))
    return ret

## Keys that we can't test the content of, but want to be present in the candidate
def check_skip_content(key):
    if key == "session_id":
        # clearly these will be different
        return True
    elif key == "output":
        # don't have any way to compare the XML output at the moment, esp. considering uuids and times
        return True
    return False

## Keys that SMS doesn't use so we don't care that they're not in the candidate
def check_skip_key(key):
    if key == "seq_id":
        # SMS doesn't use this value so doesn't matter that the indexing is different
        return True
    elif key == "style":
        # SMS doesn't use this value because SMS has no style!
        return True
    elif key == "lang":
        # SMS doesn't use this value in the response
        return True
    elif key == "langs":
        # SMS doesn't use this value in the response
        return True
    elif key == "save-id":
        # No one uses this
        return True
    elif key == "style":
        # SMS doesn't use this value because SMS has no style!
        return True
    return False