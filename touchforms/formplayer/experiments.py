import laboratory
import json

class FormplayerExperiment(laboratory.Experiment):

    session_id_mapping = {}

    def publish(self, result):

        # if we're starting a new form, we need to store the mapping between session_ids so we can use later
        if (self.name == "new-form"):
            control_session_id = json.loads(result.control.value)["session_id"]
            candidate_session_id = json.loads(result.observations[0].value)["session_id"]
            FormplayerExperiment.session_id_mapping[control_session_id] = candidate_session_id

        control = result.control
        # We're only ever returning one of these (I think)
        candidate = result.observations[0]

        print "Control took ", control.duration
        print "Candidate took ", candidate.duration

        control_value = json.loads(result.control.value)
        candidate_value = json.loads(result.observations[0].value)

        if formplayer_compare(control_value, candidate_value):
            print "Equal!"
        else:
            print "Not equal :("

def compare_list(control, candidate):
    are_equal = True
    for first_item,second_item in zip(control, candidate):
        if not formplayer_compare(first_item, second_item):
            are_equal = False
    return are_equal

def compare_dict(control, candidate):
    are_equal = True
    for key in control:
        if not key in candidate:
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

def formplayer_string_compare(control, candidate, current_key=None):
    if current_key == "session_id":
        # clearly these will be different
        return True
    elif current_key == "ix":
        # trim whitespace
        ret = (control == candidate.replace(' ', ''))
    elif current_key == "repeatable":
        if control == 0:
            ret = candidate == "false"
        elif control == 1:
            ret = candidate == "true"
        else:
            ret = control == candidate
    else:
        ret = control == candidate
    if not ret:
        print "Mismatch with key %s between control %s and candidate %s" % (current_key, control, candidate)
    return ret