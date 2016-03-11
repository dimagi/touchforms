import laboratory
import json
import logging
from django.conf import settings
import os

diff_logger = logging.getLogger('formplayer_diff')
timing_logger = logging.getLogger('formplayer_timing')


class FormplayerExperiment(laboratory.Experiment):
    session_id_mapping = {}

    def publish(self, result):
        # make sure logging dir exists
        if not os.path.exists(os.path.dirname(settings.FORMPLAYER_EXPERIMENT_DIRECTORY)):
            os.makedirs(os.path.dirname(settings.FORMPLAYER_EXPERIMENT_DIRECTORY))

        # if we're starting a new form, we need to store the mapping between session_ids so we can use later
        if (self.name == "new-form"):
            control_session_id = json.loads(result.control.value)["session_id"]
            candidate_session_id = json.loads(result.observations[0].value)["session_id"]
            FormplayerExperiment.session_id_mapping[control_session_id] = candidate_session_id

        control = result.control
        # We're only ever returning one of these (I think)
        candidate = result.observations[0]

        self.emit_timing_csv(control, candidate)

        control_value = json.loads(result.control.value)
        candidate_value = json.loads(result.observations[0].value)

        if not formplayer_compare(control_value, candidate_value):
            self.emit_diff_csv(control_value, candidate_value)

    def emit_diff_csv(self, control_value, candidate_value):
        request = self.context['request']
        action = request['action']
        diff_logger.info(
            extra={
                'action': action,
                'request': request,
                'control': control_value,
                'candidate': candidate_value
            })

    def emit_timing_csv(self, control, candidate):
        timing_logger.info(
            "MSG",
            extra={
                'action': self.name,
                'control_duration': control.duration,
                'candidate_duration': candidate.duration
            })


def compare_list(control, candidate):
    are_equal = True
    for first_item, second_item in zip(control, candidate):
        if not formplayer_compare(first_item, second_item):
            are_equal = False
    return are_equal


def compare_dict(control, candidate):
    are_equal = True
    for key in control:
        if key not in candidate:
            are_equal = False
        if not formplayer_compare(control.get(key), candidate.get(key), key):
            are_equal = False
    return are_equal


def formplayer_compare(control, candidate, current_key=None):
    if isinstance(control, dict):
        are_equal = compare_dict(control, candidate)
    elif isinstance(control, list):
        are_equal = compare_list(control, candidate)
    else:
        are_equal = formplayer_string_compare(control, candidate, current_key)
    return are_equal


## Here are a bunch of exceptions for things that are currently different between servers. We should decide what is
## right and wrong.
def formplayer_string_compare(control, candidate, current_key=None):
    if current_key == "session_id":
        # clearly these will be different
        return True
    elif current_key == "output":
        # don't have any way to compare the XML output at the moment, esp. considering uuids and times
        return True
    elif current_key == "repeatable":
        # These end up as '0' and '1' in python world, despite being set to True and False in xformplayer.py
        if control == 0:
            ret = candidate == "false"
        elif control == 1:
            ret = candidate == "true"
        else:
            ret = control == candidate
    else:
        ret = control == candidate
    if not ret:
        logging.log("Mismatch with key %s between control %s and candidate %s" % (current_key, control, candidate))
    return ret
