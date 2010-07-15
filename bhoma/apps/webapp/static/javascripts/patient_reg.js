

function wfGetPatient () {
  var flow = function (data) {
 
    var q_form_type = new wfQuestion('What type of form is this?', 'select', null, ['Registration form', 'Other form'], true);
    yield q_form_type;
    var is_reg_form = (q_form_type.value == 1);

    var q_pat_id = new wfQuestion('Patient ID', 'str', null, null, true, function (x) { return x.length != 12 ? "A valid ID is 12 digits (this ID has " + x.length + ")" : null}, 'numeric');
    var qr_lookup_pat = new wfQuery(function () { return lookup(patient_id); });
    
    if (is_reg_form) {
      var new_patient = true;
      var id_accepted = false;
      var registration_filled_out = false;
      while (!id_accepted) {
        yield q_pat_id;
        var patient_id = q_pat_id.value;
        
        yield qr_lookup_pat;
        var records_for_id = qr_lookup_pat.value;
        
        if (!registration_filled_out) {
          var patient_rec = {} //new Patient();
          for (var q in ask_patient_info(patient_rec, true)) {
            yield q;
          }
          patient_rec.id = patient_id;
          registration_filled_out = true;
        }
        
        var merge_with = null;
        if (records_for_id.length == 1) {
          var q_correct_patient = new wfQuestion('A patient is already registered with this ID. Is this the same patient?', 'select', null, 
                                                 ['Yes, this is the same patient',
                                                  'No, but I entered the wrong ID',
                                                  'No, register my new patient with this ID',
                                                  'No, start over'], true);
          yield q_correct_patient;
          var corr_pat_ans = q_correct_patient.value;

          if (corr_pat_ans == 4) {
            return; //start over
          } else if (corr_pat_ans == 2) {
            continue; //re-enter id
          } else if (corr_pat_ans == 1) {
            merge_with = records_for_id[0]['uuid'];
          }
        } else if (records_for_id.length > 1) {
          var q_choose_patient = qChooseAmongstPatients(records_for_id, 'Multiple patients found with that ID! Are any the same patient as the one you just registered?',
                                                        'None of these is the same patient');
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
                merge_with = records_for_id[corr_pat_ans - 1]['uuid'];
                chosen = true;
              }
            } else {
              chosen = true;
            }
          }
          
          if (merge_with == null) {
            var q_not_found = new wfQuestion('New registration for ID already in use: ' + patient_id, 'select', null,
                                             ['Register this new patient with the same ID',
                                              'I entered the wrong ID',
                                              'Start over'], true);
            yield q_not_found;
            var not_found_ans = q_not_found.value;
            if (not_found_ans == 3) {
              return; //start over
            } else if (not_found_ans == 2) {
              continue; //re-enter id
            }
          }
        }  
        id_accepted = true;
      }

      if (merge_with == null) {
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
            merge_with = candidate_duplicate['uuid'];
            yield new wfAlert('Remember to merge the two paper records for this patient');
          }
        }
      }

      if (merge_with) {
        data['merge_with'] = merge_with;
      }
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
          var q_choose_patient = qChooseAmongstPatients(records_for_id, 'Multiple patients found with that ID! Choose the correct patient',
                                                        'None of these is the correct patient');
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

function qChooseAmongstPatients(records, qCaption, noneCaption) {
  var choices = [];
  for (patrec in Iterator(records)) {
    patrec = patrec[1];
    choices.push(patrec['fname'] + " " + patrec['lname'] + " " + Math.floor((new Date() - new Date(patrec['dob']))/(1000.*86400*365.2425)) + "/" + patrec['sex'].toUpperCase());
  }
  choices.push(noneCaption);
  
  return new wfQuestion(qCaption, 'select', null, choices, true);
}
