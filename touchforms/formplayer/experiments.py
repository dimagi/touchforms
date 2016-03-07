import laboratory
import json

class FormplayerExperiment(laboratory.Experiment):

    session_id_mapping = {}

    def publish(self, result):

        if (self.name == "new-form"):
            control_session_id = json.loads(result.control.value)["session_id"]
            candidate_session_id = json.loads(result.observations[0].value)["session_id"]
            FormplayerExperiment.session_id_mapping[control_session_id] = candidate_session_id

        print('FormPlayerExperiment.control', result.control)
        for o in result.observations:
            print('FormPlayerExperiment.%s' % o.name, o.duration)

        control_value = json.loads(result.control.value)
        candidate_value = json.loads(result.observations[0].value)

        if formplayer_compare(control_value, candidate_value):
            print "Equal!"
            self.printDiffs(control_value, candidate_value)
        else:
            print "Not equal :("


    def printDiffs(self, control, candidate):
        diff = False
        for control_key in control:
            if control_key not in candidate:
                diff = True
                print "key %s in control, but not in candidate" %control_key
            elif control[control_key] != candidate[control_key]:
                diff = True
                if control_key == "tree":
                    print "tree"
                    for control_item, candidate_item in zip(control["tree"], candidate["tree"]):
                        self.printDiffs(control_item, candidate_item)
                else:
                    print "key %s in both but values differ (%s in control and %s in candidate)" \
                          % (control_key, control[control_key], candidate[control_key])
        if not diff:
            print "Both files are identical"

def compare_list(control, candidate):
    print "Comparing list: ", control, " candidate: ", candidate
    are_equal = True
    for first_item,second_item in zip(control, candidate):
        if not formplayer_compare(first_item, second_item):
            are_equal = False
    return are_equal

def compare_dict(control, candidate):
    print "Comparing dict: ", control, " candidate: ", candidate
    are_equal = True
    for key in control:
        if not key in candidate:
            are_equal = False
        if not formplayer_compare(control.get(key), candidate.get(key)):
            are_equal = False
    return are_equal

def formplayer_compare(control, candidate):
    print "Comparing control: ", control, " candidate: ", candidate
    if isinstance(control, dict):
        are_equal = compare_dict(control, candidate)
    elif isinstance(control, list):
        are_equal = compare_list(control, candidate)
    else:
        print "Returning: ", control == candidate
        are_equal = (control == candidate)
    return are_equal