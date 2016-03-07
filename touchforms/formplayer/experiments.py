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

        if not formplayer_compare(result.control, result.observations[0]):
            print "Not equal :("
            self.printDiffs(control_value, candidate_value)
        else:
            print "Equal!"


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
    for first_item,second_item in zip(control, candidate):
        if not formplayer_compare(first_item, second_item):
            return False
    return True

def compare_dict(control, candidate):
    for key in control:
        if not key in candidate:
            return False
        if not formplayer_compare(control.get(key), candidate.get(key)):
            return False
    return True

def formplayer_compare(control, candidate):
    if isinstance(control, dict):
        return compare_dict(control, candidate)
    if isinstance(control, list):
        return compare_list(control, candidate)
    return control == candidate