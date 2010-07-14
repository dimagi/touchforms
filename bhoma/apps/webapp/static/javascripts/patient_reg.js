

function wfGetPatient () {
  var flow = function (data) {
    var done = false;
    while (!done) {
 
      var q_pat_id = new wfQuestion('Patient ID', 'str', null, null, true);
      yield q_pat_id;
      var patient_id = q_pat_id.value;
    
      var qr_lookup_pat = new wfQuery(function () { return lookup(patient_id); });
      yield qr_lookup_pat;
      var patient_rec = qr_lookup_pat.value;

      if (patient_rec == null) {
      
        var q_reg_new = new wfQuestion('Not found. Register new patient?', 'select', null, 
                                       ['Yes, I have a registration form',
                                        'Yes, but I don\'t have a registration form',
                                        'No'], true);
        yield q_reg_new;
        var reg_new_ans = q_reg_new.value;
        var reg_new = (reg_new_ans == 1 || reg_new_ans == 2);
        var has_reg_form = (reg_new_ans == 1);
      
        if (reg_new) {
        
          var patient_rec = {} //new Patient();
          for (var q in  ask_patient_info(patient_rec, has_reg_form)) {
            yield q;
          }
          patient_rec.id = patient_id;
        
          var qr_dup_check = new wfQuery(function () { return fuzzy_match(patient_rec); });
          yield qr_dup_check;
          var candidate_duplicate = qr_dup_check.value;

          if (candidate_duplicate != null) {
            var q_merge_dup = new wfQuestion('Similar patient found! Is this the same patient?', 'select', null, 
                                             ['Yes, these are the same person',
                                              'No, this is a different person'], true);
            yield q_merge_dup;
            merge = (q_merge_dup == 1);
          } else {
            merge = false;
          }
        
          data['new_patient'] = patient_rec;
          if (merge) {
            data['merge_with'] = candidate_duplicate.id;
            yield wfAlert('Remember to merge the two paper records for this patient');
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
  }

  var onFinish = function (data) {
    alert('done! ' + JSON.stringify(data));
  }

  return new Workflow(flow, onFinish);
}

function ask_patient_info (pat_rec, full_reg_form) {
   var q_fname = new wfQuestion('First Name', 'str', null, null, true);
   yield q_fname;
   pat_rec['fname'] = q_fname.value;

   var q_lname = new wfQuestion('Last Name', 'str', null, null, true);
   yield q_lname;
   pat_rec['lname'] = q_lname.value;

   var q_sex = new wfQuestion('Sex', 'select', null, ['Male', 'Female'], full_reg_form);
   yield q_sex;
   pat_rec['sex'] = q_sex.value;
     
   if (full_reg_form) {

     var q_dob = new wfQuestion('Date of Birth', 'date', null, null, true);
     yield q_dob;
     pat_rec['dob'] = q_dob.value;
     
     var q_dob_est = new wfQuestion('Date of Birth Estimated?', 'select', null, ['Yes', 'No'], true);
     yield q_dob_est;
     pat_rec['dob_est'] = (q_dob_est.value == 'Yes');
     
     var q_village = new wfQuestion('Village', 'str', null, null, true);
     yield q_village;
     pat_rec['village'] = q_village.value;
     
     var q_contact = new wfQuestion('Contact Phone #', 'str', null, null, true);
     yield q_contact;
     pat_rec['phone'] = q_contact.value;

   } else {

     //ask age?

   }
}

function lookup (pat_id) {
  if (+pat_id == 22) {
    return {'id': pat_id, 'fname': 'DREW', 'lname': 'ROOS', 'dob': '1983-10-06'};
  } else {
    return null;
  }
}

function fuzzy_match (patient_rec) {
  if (+patient_rec.id == 33) {
    return {'id': 25, 'fname': 'DUP'};
  } else {
    return null;
  }
}

function register_new_patient (patient_rec) {

}

function log_patient_info_discrepancy () {

}