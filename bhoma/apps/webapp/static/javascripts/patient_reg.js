

function wfGetPatient () {
  var flow = function (data) {
 
    var q_form_type = new wfQuestion('What type of form is this?', 'select', null, ['Registration form', 'Other form'], true);
    yield q_form_type;
    var is_reg_form = (q_form_type.value == 1);

    var q_pat_id = new wfQuestion('Patient ID', 'str', null, null, true, function (x) { return x.length != 12 ? "A valid ID is 12 digits (this ID has " + x.length + ")" : null}, 'numeric');
    var qr_lookup_pat = new wfQuery(function () { return lookup(patient_id); });
    
    if (is_reg_form) {


    } else {
      var id_accepted = false;
      while (!id_accepted) {
        yield q_pat_id;
        var patient_id = q_pat_id.value;

        yield qr_lookup_pat;
        var records_for_id = qr_lookup_pat.value;

        var patient_rec = null;
        if (records_for_id.length == 0) {
          var q_no_record_found = new wfQuestion('No patient found for ID ' + patient_id, 'select', null,
                                                 ['Register as new patient',
                                                  'Wrong ID',
                                                  'Start over'], true);
          yield q_no_record_found;
          var no_rec_ans = q_no_record_found.value;
          
          if (no_rec_ans == 3) {
            return; //start over
          } else if (no_rec_ans == 2) {
            continue; //re-enter id
          }
        } else if (records_for_id.length == 1) {
          var q_correct_patient = new wfQuestion('Is this the correct patient?', 'select', null, 
                                                 ['Yes',
                                                  'No, wrong ID',
                                                  'No, register as new patient with the same ID',
                                                  'No, start over'], true);
          yield q_correct_patient;
          var corr_pat_ans = q_correct_patient.value;

          if (corr_pat_ans == 4) {
            return; //start over
          } else if (corr_pat_ans == 2) {
            continue; //re-enter id
          } else if (corr_pat_ans == 1) {
            patient_rec = records_for_id[0];
          }
        } else {
          //// make me a function
          var choices = [];
          for (patrec in Iterator(records_for_id)) {
            patrec = patrec[1];
            choices.push(patrec['fname'] + " " + patrec['lname'] + " " + Math.floor((new Date() - new Date(patrec['dob']))/(1000.*86400*365.2425)) + "/" + patrec['sex'].toUpperCase());
          }
          choices.push('None of these is the correct patient');
          ////

          var q_choose_patient = new wfQuestion('Multiple patients found with that ID! Choose the correct patient', 'select', null, choices, true);
          var chosen = false;
          while (!chosen) {
            yield q_choose_patient;
            var choose_pat_ans = q_choose_patient.value;
            if (choose_pat_ans < q_choose_patient.choices.length) {
              var q_correct_patient = new wfQuestion('Is this the correct patient?', 'select', null, 
                                                     ['Yes',
                                                      'No, back to list'], true);
              yield q_correct_patient;
              var corr_pat_ans = q_correct_patient.value;
              if (corr_pat_ans == 1) {
                patient_rec = records_for_id[corr_pat_ans - 1];
                chosen = true;
              }
            } else {
              chosen = true;
            }
          }

          if (patient_rec == null) {
            var q_not_found = new wfQuestion('Couldn\'t find correct patient for ID ' + patient_id, 'select', null,
                                             ['Wrong ID',
                                              'Register as new patient with the same ID',
                                              'Start over'], true);
            yield q_not_found;
            var not_found_ans = q_not_found.value;
            if (not_found_ans == 3) {
              return; //start over
            } else if (not_found_ans == 1) {
              continue; //re-enter id
            }
          }
        }
        id_accepted = true;
      }

      var new_patient;
      if (patient_rec == null) {
        new_patient = true;

        q_has_reg_form = new wfQuestion('Is there a registration form in the patient\'s file?', 'select', null, ['Yes', 'No'], true);
        yield q_has_reg_form;
        var has_reg_form = (q_has_reg_form.value == 1);

        var patient_rec = {} //new Patient();
        for (var q in ask_patient_info(patient_rec, has_reg_form)) {
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
          merge = (q_merge_dup.value == 1);
          if (merge) {
            data['merge_with'] = candidate_duplicate['uuid'];
            yield new wfAlert('Remember to merge the two paper records for this patient');
          }
        }
      } else {
        new_patient = false;
      }
    }

    data['patient'] = patient_rec;
    data['new'] = new_patient;




    /*



    while (true) {



      var qr_lookup_pat = new wfQuery(function () { return lookup(patient_id); });
      yield qr_lookup_pat;
      var patient_rec = qr_lookup_pat.value;

      if (patient_rec == null) {
      
        var q_reg_new = new wfQuestion('Not found. Register new patient?', 'select', null, 
                                       ['Yes, I have a registration form',
                                        'Yes, but I don\'t have a registration form',
                                        'No, start over'], true);
        yield q_reg_new;
        var reg_new_ans = q_reg_new.value;
        var reg_new = (reg_new_ans == 1 || reg_new_ans == 2);
        var has_reg_form = (reg_new_ans == 1);
      
        if (reg_new) {
        
          var patient_rec = {} //new Patient();
          for (var q in ask_patient_info(patient_rec, has_reg_form)) {
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
            merge = (q_merge_dup.value == 1);
          } else {
            merge = false;
          }
        
          data['new_patient'] = patient_rec;
          if (merge) {
            data['merge_with'] = candidate_duplicate.id;
            yield new wfAlert('Remember to merge the two paper records for this patient');
          }
        
          done = true;
        } else {
          // fall through; go back to 'pat id' question
        }
      
      } else {

        q_correct_patient = new wfQuestion('Is this the correct patient?', 'select', null,
                                           ['Yes, this is the patient',
                                            'No, this is the wrong patient, but right ID',
                                            'No, I mistyped the patient ID'], true);
        yield q_correct_patient;                                                             
        correct_pat = (q_correct_patient.value == 1);
        correct_id_wrong_pat = (q_correct_patient.value == 2);

        if (correct_pat) {
          data['use_patient'] = patient_rec;
          done = true;
        } else {
          if (correct_id_wrong_pat) {
            q_has_reg_form = new wfQuestion('Is this a registration form?', 'select', null, ['Yes', 'No'], true);
            yield q_has_reg_form;
            has_reg_form = (q_has_reg_form.value == 1);

            var cur_patient_rec = {} //new Patient();
            for (var q in ask_patient_info(cur_patient_rec, has_reg_form)) {
              yield q;
            }
            cur_patient_rec.id = patient_id;

            qr_match = new wfQuery(function () { return fuzzy_match(cur_patient_rec); });
            yield qr_match;
            candidate_match = qr_match.value;

            if (candidate_match != null) {
              q_patient_instead = new wfQuestion('A similar patient was found with a different ID. Use this patient instead?', 'select', null, ['Yes', 'No'], true);
              yield q_patient_instead;
              used_other = (q_patient_instead.value == 1);
            } else {
              used_other = false;
            }

            if (used_other) {
              data['use_patient'] = candidate_match;
              data['incorrect_id'] = patient_id;

              yield new wfAlert('Remember to fix the IDs on these forms and put them in the correct patient file');
              done = true;
            } else {
              q_use_current_patient_are_you_sure = new wfQuestion('Are you sure you want to file these forms on this patient\'s record?', 'select', null, ['Yes', 'No, start over'], true);
              yield q_use_current_patient_are_you_sure;
              are_you_sure = (q_use_current_patient_are_you_sure.value == 1);

              if (are_you_sure) {
                data['use_patient'] = patient_rec;
                data['conflicting_patient_info'] = cur_patient_rec;
                data['update_info'] = has_reg_form;
                done = true;
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

    */

  }

  var onFinish = function (data) {
    alert('done! ' + JSON.stringify(data));
  }

  return new Workflow(flow, onFinish);
}

function ask_patient_info (pat_rec, full_reg_form) {
  var q_fname = new wfQuestion('First Name', 'str', null, null, true, null, 'alpha');
   yield q_fname;
   pat_rec['fname'] = q_fname.value;

   var q_lname = new wfQuestion('Last Name', 'str', null, null, true, null, 'alpha');
   yield q_lname;
   pat_rec['lname'] = q_lname.value;

   var q_sex = new wfQuestion('Sex', 'select', null, ['Male', 'Female'], full_reg_form);
   yield q_sex;
   pat_rec['sex'] = (q_sex.value == 1 ? 'm' : 'f');
     
   if (full_reg_form) {

     var q_dob = new wfQuestion('Date of Birth', 'date', null, null, true, function (x) { return (new Date(x) - new Date()) > 1.5 * 86400000 ? "Cannot be in the future" : null });
     yield q_dob;
     pat_rec['dob'] = q_dob.value;
     
     var q_dob_est = new wfQuestion('Date of Birth Estimated?', 'select', null, ['Yes', 'No'], true);
     yield q_dob_est;
     pat_rec['dob_est'] = (q_dob_est.value == 'Yes');
     
     var q_village = new wfQuestion('Village', 'str', null, null, false, null, 'alpha');
     yield q_village;
     pat_rec['village'] = q_village.value;
     
     var q_contact = new wfQuestion('Contact Phone #', 'str', null, null, false, null, 'phone');
     yield q_contact;
     pat_rec['phone'] = q_contact.value;

   } else {

     //ask age and deduce estimated birth date?

   }
}

function lookup (pat_id) {
  if (pat_id == '000000000022') {
    return [{'uuid': '03cf9a2b', 'id': pat_id, 'fname': 'DREW', 'lname': 'ROOS', 'dob': '1983-10-06', 'dob-est': false, 'sex': 'm', 'village': 'SOMERVILLE', 'phone': '+19183739767'}];
  } else if (pat_id == '000000000023') {
    return [{'uuid': '03cf9a2b', 'id': pat_id, 'fname': 'DREW', 'lname': 'ROOS', 'dob': '1983-10-06', 'dob-est': false, 'sex': 'm', 'village': 'SOMERVILLE', 'phone': '+19183739767'},
            {'uuid': '04cf9a2b', 'id': pat_id, 'fname': 'GREG', 'lname': 'TRIFILO', 'dob': '1983-10-06', 'dob-est': false, 'sex': 'm', 'village': 'SOMERVILLE', 'phone': '+19183739767'},
            {'uuid': '05cf9a2b', 'id': pat_id, 'fname': 'ABBEY', 'lname': 'LOUTREC', 'dob': '1983-10-06', 'dob-est': false, 'sex': 'f', 'village': 'SOMERVILLE', 'phone': '+19183739767'}];
  } else {
    return [];
  }
}

function fuzzy_match (patient_rec) {
  if (patient_rec['fname'] == 'DREW' && patient_rec['lname'] == 'ROOS') {
    return {'uuid': '03cf9aeb', 'id': '000000000037', 'fname': 'DREW', 'lname': 'ROOS', 'dob': '1983-10-06', 'dob-est': false, 'sex': 'm', 'village': 'SOMERVILLE', 'phone': '+19183739767'};
  } else {
    return null;
  }
}
