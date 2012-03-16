
function xformAjaxAdapter (formName, sessionData, savedInstance, ajaxfunc, submitfunc) {
  this.formName = formName;
  this.sessionData = sessionData;
  this.session_id = -1;
  this.ajaxfunc = ajaxfunc;
  this.submitfunc = submitfunc;

  this.loadForm = function ($div) {
    adapter = this;
    this.ajaxfunc({'action': 'new-form',
                   'form-name': this.formName,
                   'instance-content': savedInstance,
                   'session-data': this.sessionData,
                   'nav': 'fao'},
      function (resp) {
        adapter.session_id = resp["session_id"];
        init_render(resp, adapter, $div);
      });
  }

  this.answerQuestion = function (q) {
    var ix = getIx(q);
    var answer = q.getAnswer();

    var adapter = this;
    this.ajaxfunc({'action': 'answer',
                   'session-id': this.session_id,
                   'ix': ix,
                   'answer': answer},
      function (resp) {
        if (resp["status"] == "validation-error") {
          adapter.showError(q, resp);
        } else {
          q.clearError();
          getForm(q).reconcile(resp["tree"]);
        }
      });
  }

  this.newRepeat = function(repeat) {
    this.ajaxfunc({'action': 'new-repeat',
                   'session-id': this.session_id,
                   'ix': getIx(repeat)},
      function (resp) {
        getForm(repeat).reconcile(resp["tree"]);
      },
      true);
  }

  this.deleteRepeat = function(repetition) {
    var juncture = getIx(repetition.parent);
    var rep_ix = +(repetition.rel_ix.split(":").slice(-1)[0]) + 1;
    this.ajaxfunc({'action': 'delete-repeat', 
                   'session-id': this.session_id,
                   'ix': rep_ix,
                   'form_ix': juncture},
      function (resp) {
        getForm(repetition).reconcile(resp["tree"]);
      },
      true);
  }

  this.submitForm = function(form) {
    var answers = {};
    var prevalidated = true;
    var accumulate_answers = function(o) {
      if (o.type != 'question') {
        $.each(o.children, function(i, val) {
            accumulate_answers(val);
          });
      } else {
        if (o.prevalidate()) {
          answers[getIx(o)] = o.getAnswer();
        } else {
          prevalidated = false;
        }
      }
    }
    accumulate_answers(form);

    var adapter = this;
    this.ajaxfunc({'action': 'submit-all',
                   'session-id': this.session_id,
                   'answers': answers,
                   'prevalidated': prevalidated},
      function (resp) {
        if (resp.status == 'success') {
          form.submitting();
          adapter.submitfunc(resp);
        } else {
          $.each(resp.errors, function(ix, error) {
              adapter.showError(getForIx(form, ix), error);
            });
          alert('There are errors in this form; they must be corrected before the form can be submitted.');
        }
      },
      true);
  }

  this.showError = function(q, resp) {
    if (resp["type"] == "required") {
      q.showError("An answer is required");
    } else if (resp["type"] == "constraint") {
      q.showError(resp["reason"] || 'This answer is outside the allowed range.');      
    }
  }
}

function submit_redirect(params, path, method) {
  // hat tip: http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
  method = method || "post"; // Set method to post by default, if not specified.
  path = path || "";
  // The rest of this code assumes you are not using a library.
  // It can be made less wordy if you use one.
  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);
  
  for(var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    
    form.appendChild(hiddenField);
  }
  // required for FF 3+ compatibility
  document.body.appendChild(form);
  form.submit();
}