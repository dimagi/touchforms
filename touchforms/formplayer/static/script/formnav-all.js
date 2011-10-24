
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
    tmprender(tree);
    return;


    if (event["type"] == "question") {
      if (event["style"]["domain"])
        event["domain"] = event["style"]["domain"];
      event.domain_meta = this.domain_meta(event);

      renderQuestion(event, dirForward);
    } else if (event["type"] == "form-complete") {
      var self = this;
      var done = function () { self._formComplete(event); };

      if (xformAreYouDone()) {
        confirmDone(done);
      } else {
        done();
      }
    } else if (event["type"] == "sub-group") {
      this._step(dirForward);
    } else if (event["type"] == "repeat-juncture") {
      event["datatype"] = "select";

      var options = [];
      for (var i = 0; i < event["repetitions"].length; i++) {
        options.push({lab: event["repetitions"][i], val: 'rep' + (i + 1)});
      }

      if (!event["repeat-delete"]) {
        event["caption"] = event["main-header"];
        
        if (event["add-choice"] != null) {
          options.push({lab: event["add-choice"], val: 'add'});
        }
        if (event["del-choice"] != null) {
          options.push({lab: event["del-choice"], val: 'del'});
        }
        options.push({lab: event["done-choice"], val: 'done'});
      } else {
        event["caption"] = event["del-header"];
      }

      event["choices"] = options;
      event["answer"] = null;
      event["required"] = true;

      renderQuestion(event, dirForward);
    } else {
      alert("unrecognized event [" + event["type"] + "]");
    }
  }

  this._step = function (dirForward) {
    BACK_AT_START_ABORTS = true;

    //handle 'which repeat to delete?' interstitial
    if (!dirForward && activeQuestion["repeat-delete"]) {
      activeQuestion["repeat-delete"] = false;
      this._renderEvent(activeQuestion, false);
      return;
    }

    adapter = this;
    this.serverRequest(XFORM_URL, {'action': (dirForward ? 'next' : 'back'),
                                   'session-id': this.session_id},
      function (resp) {
        if (!dirForward && resp["at-start"] && BACK_AT_START_ABORTS) {
          adapter.abort();
        } else {
          adapter._renderEvent(resp["event"], dirForward || resp["at-start"]);
        }
      });
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

  this.serverRequest = function (url, params, callback) {
    serverRequest(
      function (cb) {
        jQuery.post(url, JSON.stringify(params), cb, "json");
      },
      callback
    );
  }
}

var requestInProgress = false;
function serverRequest (makeRequest, callback) {
  if (requestInProgress) {
    //console.log('request is already in progress; aborting');
    return;
  }
  requestInProgress = true;
  
  var ajaxDeactivate = ajaxActivate();
  makeRequest(function (resp) {
      requestInProgress = false;
      callback(resp);
      ajaxDeactivate();
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