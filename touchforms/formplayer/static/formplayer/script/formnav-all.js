
function xformAjaxAdapter (formName, preloadTags, savedInstance) {
  this.formName = formName;
  this.preloadTags = preloadTags;
  this.session_id = -1;

  this.loadForm = function () {
    adapter = this;
    preload_data = {};
    for (var type in this.preloadTags) {
        var dict = this.preloadTags[type];
        preload_data[type] = {};
        for (var key in dict) {
            var val = dict[key];
            if (!val) {
                console.log("no val for", key, "in", dict);
            }
            // this special character indicates a server preloader, which 
            // we make a synchronous request for
            if (val && val.indexOf("<") === 0) {
                valback = jQuery.ajax({url: PRELOADER_URL, type: 'GET', data:{"param": val}, async: false}).responseText;
                preload_data[type][key] = valback;
            } else {
                preload_data[type][key] = val
            }
        }
    }
    this.serverRequest(XFORM_URL, {'action': 'new-form',
                                   'form-name': this.formName,
                                   'instance-content': savedInstance,
                                   'preloader-data': preload_data,
                                   'nav': 'fao'},
      function (resp) {
        adapter.session_id = resp["session_id"];
        adapter._renderForm(resp);
      });
  }

  this.answerQuestion = function (q) {
    var ix = getIx(q);
    var answer = q.getAnswer();

    var adapter = this;
    this.serverRequest(XFORM_URL, {'action': 'answer',
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
    this.serverRequest(XFORM_URL, {'action': 'new-repeat',
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
    this.serverRequest(XFORM_URL, {'action': 'delete-repeat', 
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
    this.serverRequest(XFORM_URL, {'action': 'submit-all',
                                   'session-id': this.session_id,
                                   'answers': answers,
                                   'prevalidated': prevalidated},
      function (resp) {
        if (resp.status == 'success') {
          form.submitting();
          adapter._formComplete(resp);
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

  this._renderForm = function(form) {
    init_render(form);
  }

  this._formComplete = function (params) {
    params.type = 'form-complete';
    submit_redirect(params);
  }

  this.serverRequest = function (url, params, callback, blocking) {
    serverRequest(
      function (cb) {
        jQuery.post(url, JSON.stringify(params), cb, "json");
      },
      callback,
      blocking
    );
  }
}

var BLOCKING_REQUEST_IN_PROGRESS = false;
var LAST_REQUEST_HANDLED = -1;
var NUM_PENDING_REQUESTS = 0;
// makeRequest - function that takes in a callback function and executes an
//     asynchronous request (GET, POST, etc.) with the given callback
// callback - callback function for request
// blocking - if true, no further simultaneous requests are allowed until
//     this request completes
function serverRequest (makeRequest, callback, blocking) {
  if (BLOCKING_REQUEST_IN_PROGRESS) {
    return;
  }

  NUM_PENDING_REQUESTS++;
  $('#loading').show();

  if (blocking) {
    inputActivate(false); // sets BLOCKING_REQUEST_IN_PROGRESS
  }
  makeRequest(function (resp) {
      // ignore responses older than the most-recently handled
      if (resp.seq_id && resp.seq_id < LAST_REQUEST_HANDLED) {
        return;
      }
      LAST_REQUEST_HANDLED = resp.seq_id;

      callback(resp);
      if (blocking) {
        inputActivate(true); // clears BLOCKING_REQUEST_IN_PROGRESS
      }

      NUM_PENDING_REQUESTS--;
      if (NUM_PENDING_REQUESTS == 0) {
        $('#loading').hide();
      }
    });
}

function getQuestionAnswer () {
  return activeControl.getAnswer();
}

function answerQuestion () {
  gFormAdapter.answerQuestion(getQuestionAnswer());
}

function prevQuestion () {
  gFormAdapter.prevQuestion();
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