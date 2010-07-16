
function wfGetPatient () {
  var flow = function (data) {
 
    yield qSinglePatInfo('right patient?', ['fawe wfw ea', 'wef wb', 'cfwawef  wef we aw ewfe w a wefw']);

    var new_patient_rec = null;       //any new record created via registration form
    var existing_patient_rec = null;  //any existing record select by the user as belonging to the current patient
    //these fields are not mutually exclusive

    var q_form_type = qSelectReqd('What type of form is this?', ['Registration form', 'Other form']);
    yield q_form_type;
    var is_reg_form = (q_form_type.value == 1);
    
    var id_accepted = false;
    var need_to_fill_registration_upfront = is_reg_form;

    //we offer the option to correct a mistakenly entered ID, thus this loop
    while (!id_accepted) {

      //enter patient id
      var q_pat_id = new wfQuestion('Patient ID', 'str', null, null, true, function (x) { return x.length != 12 ? "A valid ID is 12 digits (this ID has " + x.length + ")" : null}, 'numeric');
      yield q_pat_id;
      var patient_id = q_pat_id.value;

      //retrieve existing matches for that id
      var qr_lookup_pat = new wfQuery(function () { return lookup(patient_id); }); 
      yield qr_lookup_pat;
      var records_for_id = qr_lookup_pat.value;
 
      //for registration forms we always have them fill out the reg info upfront (but only once even if we re-ask patient id)
      if (need_to_fill_registration_upfront) {
        new_patient_rec = {} //new Patient();
        for (var q in ask_patient_info(new_patient_rec, true)) {
          yield q;
        }
        new_patient_rec.id = patient_id;
        need_to_fill_registration_upfront = false;
      }
        
      if (!is_reg_form && records_for_id.length == 0) {
        //if not a reg form, give them the option to bail if ID not found

        var q_no_record_found = qSelectReqd('No patient found for ID ' + patient_id,
                                            ['Register as new patient',
                                             'Wrong ID',
                                             'Start over']);
        yield q_no_record_found;
        var no_rec_ans = q_no_record_found.value;
        
        if (no_rec_ans == 3) {
          return; //start over
        } else if (no_rec_ans == 2) {
          continue; //re-enter id
        }
      } else if (records_for_id.length == 1) {
        //if one match, verify match
        if (is_reg_form) {
          var q_correct_patient = qSelectReqd('A patient is already registered with this ID. Is this the same patient?',
                                              ['Yes, this is the same patient',
                                               'No, I entered the wrong ID',
                                               'No, continue registering my new patient with this ID',
                                               'No, start over']);
        } else {
          var q_correct_patient = qSelectReqd('Is this the correct patient?', 
                                              ['Yes',
                                               'No, I entered the wrong ID',
                                               'No, I will register a new patient with the same ID',
                                               'No, start over']);
        }
        yield q_correct_patient;
        var corr_pat_ans = q_correct_patient.value;
        
        if (corr_pat_ans == 4) {
          return; //start over
        } else if (corr_pat_ans == 2) {
          continue; //re-enter id
        } else if (corr_pat_ans == 1) {
          existing_patient_rec = records_for_id[0];
        }
      } else if (records_for_id.length > 1) {
        //if many matches for that ID, pick one or none
        if (is_reg_form) {
          var q_choose_patient = qChooseAmongstPatients(records_for_id, 'Multiple patients found with that ID! Are any the same patient as the one you just registered?',
                                                        'None of these is the same patient');
        } else {
          var q_choose_patient = qChooseAmongstPatients(records_for_id, 'Multiple patients found with that ID! Choose the correct patient',
                                                        'None of these is the correct patient');
        }        

        var chosen = false;
        while (!chosen) {
          yield q_choose_patient;
          var choose_pat_ans = q_choose_patient.value;
          if (choose_pat_ans < q_choose_patient.choices.length) {
            var q_correct_patient = qSelectReqd('Is this the ' + (is_reg_form ? 'same' : 'correct') + ' patient?', ['Yes', 'No, back to list']);
            yield q_correct_patient;
            var corr_pat_ans = q_correct_patient.value;
            if (corr_pat_ans == 1) {
              existing_patient_rec = records_for_id[corr_pat_ans - 1];
              chosen = true;
            }
          } else {
            chosen = true;
          }
        }
        
        //picked none; offer option to bail or continue with new reg
        if (existing_patient_rec == null) {
          if (is_reg_form) {
            var q_not_found = qSelectReqd('Couldn\'t find correct patient for ID ' + patient_id,
                                          ['Register as new patient with the same ID',
                                           'I entered the wrong ID',
                                           'Start over']);
          } else {
            var q_not_found = qSelectReqd('New registration for ID already in use: ' + patient_id,
                                          ['Register this new patient with the same ID',
                                           'I entered the wrong ID',
                                           'Start over']);
          }
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

    //if no record has been chosen (for reg: a record that collides with current ID, for other: the patient lookup result)
    if (existing_patient_rec == null) {

      //for non-registration forms, optionally register the non-existent patient here
      if (new_patient_rec == null) {
        q_has_reg_form = qSelectReqd('Is there a registration form in the patient\'s file?', ['Yes', 'No']);
        yield q_has_reg_form;
        var has_reg_form = (q_has_reg_form.value == 1);
        
        new_patient_rec = {} //new Patient();
        for (var q in ask_patient_info(new_patient_rec, has_reg_form)) {
          yield q;
        }
        new_patient_rec.id = patient_id;
      }
      
      //check for similar record under a different ID
      var qr_dup_check = new wfQuery(function () { return fuzzy_match(new_patient_rec); });
      yield qr_dup_check;
      var candidate_duplicate = qr_dup_check.value;
      
      if (candidate_duplicate != null) {
        var q_merge_dup = qSelectReqd('Similar patient found! Is this the same patient?',
                                      ['Yes, these are the same person',
                                       'No, this is a different person']);
        yield q_merge_dup;
        merge = (q_merge_dup.value == 1);
        if (merge) {
          existing_patient_rec = candidate_duplicate;
          yield new wfAlert('Remember to merge the two paper records for this patient');
        }
      }
    }

    //summarize result of workflow
    data['new'] = (new_patient_rec != null);
    if (data['new']) {
      data['patient'] = new_patient_rec;
      if (existing_patient_rec != null)
        data['merge_with'] = existing_patient_rec['uuid'];
    } else {
      data['patient'] = existing_patient_rec;
    }
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

   if (pat_rec['lname'] == "OTHER WHITE MEAT") {
     yield qPork();
   }

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

function qChooseAmongstPatients (records, qCaption, noneCaption) {
  var choices = [];
  for (patrec in Iterator(records)) {
    patrec = patrec[1];
    choices.push(patrec['fname'] + " " + patrec['lname'] + " " + Math.floor((new Date() - new Date(patrec['dob']))/(1000.*86400*365.2425)) + "/" + patrec['sex'].toUpperCase());
  }
  choices.push(noneCaption);
  
  return qSelectReqd(qCaption, choices);
}

function qSelectReqd (caption, choices) {
  return new wfQuestion(caption, 'select', null, choices, true);
}

function qSinglePatInfo (caption, choices, pat_content, selected) {
  pat_content =  '<div align="center" style="font-size: 80%;"> \
            <table border="0" style="max-width: 480px; border: 3px solid black; padding: 10px; background-color: white;"> \
             <tr><td>ID:&nbsp;&nbsp;</td><td><b>343-534-23453-4</b></td></tr> \
             <tr><td valign="top">Name:&nbsp;&nbsp;</td><td><b>JAWEeRGERGEFWECKSON, JOSERGSERGERGNATHAN</b></td></tr> \
             <tr><td>Sex:&nbsp;&nbsp;</td><td><b>Male</b></td></tr> \
             <tr><td>Birthdate:&nbsp;&nbsp;</td><td><b>06/10/83 (est)</b></td></tr> \
             <tr><td>Age:&nbsp;&nbsp;</td><td><b>26 yrs</b></td></tr> \
             <tr><td>Village:&nbsp;&nbsp;</td><td><b>SOMERVILLE</b></td></tr> \
             <tr><td>Contact:&nbsp;&nbsp;</td><td><b>+26099435784</b></td></tr> \
          </table> \
        </div>';
  selected = [1];
  selected = selected || [];

  var BUTTON_SECTION_HEIGHT = 260;
  var choice_data = choiceSelect(choices, selected, false, 920, BUTTON_SECTION_HEIGHT - 20); //annoying we have to munge the dimensions manually
  var markup = new Layout('patinfosplit', 2, 1, '*', ['*', 260], 15, 3, null, null, null, [
      new CustomContent(null, pat_content),
      choice_data[0]
    ]);

  return new wfQuestion(caption, 'select', null, null, false, null, null, function () {
      questionEntry.update(markup);
      activeInputWidget = choice_data[1];
  });
}

function qPork () {
  return new wfQuestion('PORK!', 'select', null, null, false, null, null, function () {
      questionEntry.update(new CustomContent(null, '<table width="100%" height="100%"><tr><td align="center" valign="middle"><embed src="/static/webapp/352_pork3b.swf" \
           quality="high" width="550" height="400" align="middle" allowScriptAccess="sameDomain" allowFullScreen="false" play="true" type="application/x-shockwave-flash" /></td></tr></table>'));
      activeQuestionWidget = [];
  });
}

