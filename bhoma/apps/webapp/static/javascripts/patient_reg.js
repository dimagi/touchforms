

function wfGetPatient () {
  var flow = function (data) {
    done = false;
    //    while (!done) {
    for(var i = 0; i < 2; i++) {
 
      q1 = new workflowQuestion('q1', 'int', 5, null, true, function (x) { console.log('a'+x); return x < 15 ? "NO!" : null;});
      yield q1;
      
      if (q1.value < 10)
        yield new workflowQuestion('q2', 'str', 'drew');
      else
        yield new workflowQuestion('q3', 'date', '2010-04-17');
      
      yield new workflowQuestion('q4', 'select', 2, ['a', 'b', 'c']);
      yield new workflowQuestion('q5', 'multiselect', '2 3', ['a', 'b', 'c']);
      
      data['x'] = q1.value;
      done = true;
    }

      /*
      q_pat_id = Question();
      yield q_pat_id;
      patient_id = q_pat_id.value;
    
      patient_rec = lookup(patient_id);
      if (patient_rec == null) {
      
        q_reg_new;
        reg_new_ans = yield q_reg_new;
        reg_new = (reg_new_ans == 'yes-reg' || reg_new_ans == 'yes-noreg');
        has_reg_form = (reg_new_ans == 'yes-reg');
      
        if (reg_new) {
        
          patient_rec = new Patient();
          reg_form = ask_patient_info(patient_rec, has_reg_form);
          for (q in reg_form) {
            reg_form.send(yield q);
          }
          patient_rec.id = patient_id;
        
          candidate_duplicate = fuzzy_match(patient_rec);
          if (candidate_duplicate != null) {
            q_merge_duplicate;
            merge = yield q_merge_duplicate;
          } else {
            merge = false;
          }
        
          register_new_patient(patient_rec);
          if (merge) {
            merge_duplicate_records(patient_id, candidate_duplicate.id);
            alert_consolidate_paper_records;
            yield alert_consolidate_paper_records;
          }
        
          done = true;
        } else {
          // fall through; go back to 'pat id' question
        }
      
      } else {
        q_correct_patient;
        correct_pat = yield q_correct_patient;
      
        if (correct_pat) {
          done = true;
        } else {
          q_correct_id;
          correct_id = yield q_correct_id;

          if (correct_id) {
            q_has_reg_form;
            has_reg_form = yield q_has_reg_form;

            cur_patient_rec = ask_patient_info(has_reg_form);
            candidate_match = fuzzy_lookup(cur_patient_rec);

            if (candidate_match != null) {
              q_patient_instead;
              used_other = yield q_patient_instead;

              alert_fix_ids_on_paper;
              yield alert_fix_ids_on_paper;

              patient_rec = candidate_match;
              patient_id = patient_rec.id;
            } else {
              used_other = false;
            }

            if (used_other) {
              done = true;
            } else {
              q_use_current_patient_are_you_sure;
              are_you_sure = yield q_use_current_patient_are_you_sure;

              if (are_you_sure) {
                log_patient_info_discrepancy(patient_id, patient_rec);
              } else {
                // fall through; go back to 'pat id' question
              }
            }
          } else {
            // fall through; go back to 'pat id' question
          }
        }
      }

    }

    //patient id
    //patient rec

    */
  }

  var onFinish = function (data) {
    alert('done! ' + JSON.stringify(data));
  }

  return new Workflow(flow, onFinish);
}

function ask_patient_info (full_reg_form) {

}

function lookup (pat_id) {

}

function fuzzy_match (patient_rec) {

}

function register_new_patient (patient_rec) {

}

function log_patient_info_discrepancy () {

}