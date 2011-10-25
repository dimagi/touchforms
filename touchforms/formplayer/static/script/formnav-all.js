
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
            // this special character indicates a server preloader, which 
            // we make a synchronous request for
            if (val.indexOf("<") === 0) {
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
        adapter._renderTree(resp["tree"], true);
      });
  }

  this.answerQuestion = function (q) {
    var ix = q.ix;
    var answer = q.getAnswer();

    var adapter = this;
    this.serverRequest(XFORM_URL, {'action': 'answer',
                                   'session-id': this.session_id,
                                   'ix': ix,
                                   'answer': answer},
      function (resp) {
        if (resp["status"] == "validation-error") {
          if (resp["type"] == "required") {
            q.showError("An answer is required");
          } else if (resp["type"] == "constraint") {
            q.showError(resp["reason"] || 'This answer is outside the allowed range.');      
          }
        } else {
          q.showError('');
          getForm(q).reconcile(resp["tree"]);
        }
      });
  }

  this.newRepeat = function(repeat) {
    this.serverRequest(XFORM_URL, {'action': 'new-repeat',
                                   'session-id': this.session_id,
                                   'ix': repeat.ix},
      function (resp) {
        getForm(repeat).reconcile(resp["tree"]);
      });
  }

  this.deleteRepeat = function(repeat) {
    
    //ix -> form_ix!!

    /*
      } else if (answer.substring(0, 3) == 'rep') {
        var repIx = +answer.substring(3);
        this.serverRequest(XFORM_URL, {'action': (activeQuestion["repeat-delete"] ? 'delete-repeat' :'edit-repeat'), 
                'session-id': this.session_id, 'ix': repIx},
          function (resp) {
            adapter._renderEvent(resp["event"], true);
            });*/
  }

  this.prevQuestion = function () {
    this._step(false);
  }

  this.domain_meta = function (event) {
    var meta = {};

    if (event.datatype == "date") {
      meta.mindiff = event["style"]["before"] != null ? +event["style"]["before"] : null;
      meta.maxdiff = event["style"]["after"] != null ? +event["style"]["after"] : null;
    } else if (event.datatype == "int" || event.datatype == "float") {
      meta.unit = event["style"]["unit"];
    } else if (event.datatype == 'str') {
      meta.autocomplete = (event["style"]["mode"] == 'autocomplete');
      meta.autocomplete_key = event["style"]["autocomplete-key"];
      meta.mask = event["style"]["mask"];
      meta.prefix = event["style"]["prefix"];
      meta.longtext = (event["style"]["raw"] == 'full');
    } else if (event.datatype == "multiselect") {
      if (event["style"]["as-select1"] != null) {
        meta.as_single = [];
        var vs = event["style"]["as-select1"].split(',');
        for (var i = 0; i < vs.length; i++) {
          var k = +vs[i];
          if (k != 0) {
            meta.as_single.push(k);
          }
        }
      }
    }

    return meta;
  }

  this._renderTree = function(tree) {
    init_render(tree);
  }

  this._formComplete = function (params) {
    interactionComplete(function () { submit_redirect(params); });
  }

  this.abort = function () {
    interactionComplete(function () { submit_redirect({type: 'form-aborted'}); });
  }

  this.quitWarning = function () {
    return {
      'main': 'This form isn\'t finished! If you go HOME, you will throw out this form.',
      'quit': 'Go HOME; discard form',
      'cancel': 'Stay and finish form'
    }
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
var REQUEST_ID = 0;
// makeRequest - function that takes in a callback function and executes an
//     asynchronous request (GET, POST, etc.) with the given callback
// callback - callback function for request
// blocking - if true, no further simultaneous requests are allowed until
//     this request completes
function serverRequest (makeRequest, callback, blocking) {
  if (BLOCKING_REQUEST_IN_PROGRESS) {
    return;
  }

  REQUEST_ID++;
  if (blocking) {
    inputActivate(false); // sets BLOCKING_REQUEST_IN_PROGRESS
  }
  //closure to save the current REQUEST_ID for this request
  var make_managed_callback = function(req_id) {
    return function (resp) {
      // ignore responses for all but the most recently-made request
      if (req_id != REQUEST_ID) {
        return;
      }

      callback(resp);
      if (blocking) {
        inputActivate(true); // clears BLOCKING_REQUEST_IN_PROGRESS
      }
    }
  }
  makeRequest(make_managed_callback(REQUEST_ID));
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

var interactionDone = false;
function interactionComplete (submit) {
  if (interactionDone) {
    //console.log('interaction already done; ignoring');
    return;
  }
  
  interactionDone = true;
  disableInput();
  var waitingTimer = setTimeout(function () { touchscreenUI.showWaiting(true); }, 300);
  
  submit();
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