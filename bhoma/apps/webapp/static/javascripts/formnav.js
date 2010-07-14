
function xformAjaxAdapter (formName, preloadData) {
  this.formName = formName;
  this.preloadData = preloadData;
  this.session_id = -1;

  this.loadForm = function () {
    adapter = this;
    jQuery.post(XFORM_URL, JSON.stringify({'action': 'new-form', 
                                           'form-name': this.formName,
                                           'preloader-data': this.preloadData}),
      function (resp) {
        adapter.session_id = resp["session_id"];
        adapter._renderEvent(resp["event"], true);
      },
      "json");
  }

  this.answerQuestion = function (answer) {
    adapter = this;
    jQuery.post(XFORM_URL, JSON.stringify({'action': 'answer',
                                           'session-id': this.session_id,
                                           'answer': answer}),
      function (resp) {
        if (resp["status"] == "validation-error") {
          if (resp["type"] == "required") {
            showError("An answer is required");
          } else if (resp["type"] == "constraint") {
            showError(resp["reason"]);      
          }
        } else {
          adapter._renderEvent(resp["event"], true);
        }
      },
      "json");
  }

  this.prevQuestion = function () {
    this._step(false);
  }

  this._renderEvent = function (event, dirForward) {
    if (event["type"] == "question") {
      renderQuestion(event, dirForward);
    } else if (event["type"] == "form-complete") {
      this._formComplete(event);
    } else if (event["type"] == "sub-group") {
      if (event["repeatable"]) {
        alert("i can't support repeats right now!");
      }
      
      this._step(dirForward);
    } else {
      alert("unrecognized event [" + event["type"] + "]");
    }
  }

  this._step = function (dirForward) {
    adapter = this;
    jQuery.post(XFORM_URL, JSON.stringify({'action': (dirForward ? 'next' : 'back'),
                                           'session-id': this.session_id}),
      function (resp) {
        adapter._renderEvent(resp["event"], dirForward || resp["at-start"]);
      },
      "json");
  }

  this._formComplete = function (params, path, method) {
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

}

function Workflow (flow, onFinish) {
  this.flow = flow;
  this.onFinish = onFinish;
  this.data = null;

  this.start = function () {
    this.data = {}
    return this.flow(this.data);
  }

  this.finish = function () {
    this.onFinish(this.data);
  }
}

function wfQuestion (caption, type, answer, choices, required, validation) {
  this.caption = caption;
  this.type = type;
  this.value = answer || null;
  this.choices = choices;
  this.required = required || false;
  this.validation = validation || function (ans) { return null; };

  this.to_q = function () {
    return {'caption': this.caption,
            'datatype': this.type,
            'answer': this.value,
            'choices': this.choices,
            'required': this.required};
  }

  this.validate = function () {
    if (this.required && this.value == null) {
      return "An answer is required";
    } else {
      return this.validation(this.value);
    }
  }
}

function wfQuery (query) {
  this.query = query;
  this.value = null;
  this.eval = function () {
    this.value = this.query();
  }
}

function wfAlert (message) {
  this.message = message;

  this.to_q = function () {
    return {'caption': this.message,
            'datatype': 'select',
            'answer': null,
            'choices': ['OK'],
            'required': true};
  }
}

function workflowAdapter (workflow, onCancel) {
  this.wf = workflow;
  this.onCancel = onCancel || function () {alert('backed out');}; //debug

  this.wf_inst = null;
  this.history = null;
  this.active_question = null;

  this.loadForm = function () {
    this.wf_inst = this.wf.start();
    this.history = [];
    this.active_question = null;

    this._jumpNext();
  }

  this.answerQuestion = function (answer) {
    //type = this.active_question.type;
    //if (type == 'date')
    //  answer = new Date(answer);

    this.active_question.value = answer;
    var val_error = this.active_question.validate()
    if (val_error == null) {
      this._push_hist(answer, this.active_question);
    } else {
      showError(val_error);
    }
  }

  this.prevQuestion = function () {
    hist_length = this.history.length;
    while (hist_length > 0 && !this.history[hist_length - 1][0]) {
      hist_length--;
    }

    if (hist_length == 0) {
      this.onCancel();
      return;
    }

    this.wf_inst = this.wf.start();
    for (var i = 0; i < hist_length; i++) {
      ev = this._getNext();
      ev.value = this.history[i][1];
      if (i == hist_length - 1) {
        this._activateQuestion(ev, false);
      }
    }

    while (this.history.length > hist_length - 1)
      this.history.pop();
  }

  this._getNext = function () {
    try {
      return this.wf_inst.next();
    } catch (e if e instanceof StopIteration) {
      return null;
    }
  }

  this._jumpNext = function () {
    ev = this._getNext();
    if (ev == null) {
      this._formComplete();
    } else if (ev instanceof wfQuestion) {
      this._activateQuestion(ev, true);
    } else if (ev instanceof wfQuery) {
      ev.eval();
      this._push_hist(ev.value, ev);
    } else if (ev instanceof wfAlert) {
      this._activateQuestion(ev, true); //hack
    }
  }

  this._activateQuestion = function (ev, dir) {
    this.active_question = ev;
    renderQuestion(ev.to_q(), dir);
  }

  this._push_hist = function (answer, ev) {
    this.history.push([ev instanceof wfQuestion, answer]);
    this._jumpNext();
  }

  this._formComplete = function () {
    this.wf.finish();
  }
}

function renderQuestion (event, dir) {
  activeQuestion = event;
  questionCaption.setText(event["caption"]);
 
  if (event["datatype"] == "str" ||
      event["datatype"] == "int" ||
      event["datatype"] == "float") {
    questionEntry.update(freeEntry);
    answerBar.update(freeTextAnswer);

    if (event["datatype"] == "str") {
      kbd = keyboard;
    } else if (event["datatype"] == "int") {
      kbd = numPad;
    } else if (event["datatype"] == "float") {
      kbd = numPadDecimal;
    }

    freeEntryKeyboard.update(kbd);    
    activeInputWidget = answerText;
    
    if (event["answer"] != null) {
      answerText.setText(event["answer"]);
    }
  } else if (event["datatype"] == "select" || event["datatype"] == "multiselect") {
    selections = (event["datatype"] == "select" ? [event["answer"]] : event["answer"]);
    chdata = choiceSelect(event["choices"], selections, event["datatype"] == "multiselect");
    questionEntry.update(chdata[0]);
    activeInputWidget = chdata[1];
  } else if (event["datatype"] == "date") {
    dateEntryContext = new DateWidgetContext(dir, event["answer"]);
    dateEntryContext.refresh();
  } else if (event["datatype"] == "info") {
    questionEntry.update(null);
  } else {
    alert("unrecognized datatype [" + event["datatype"] + "]");
  }

  if (event["answer"] == null) {
    clearClicked();
  }
}

function getQuestionAnswer () {
  type = activeQuestion["datatype"];

  if (type == "str" || type == "int" || type == "float") {
    var val = answerText.child.control.value;
    if (val == "") {
      return null;
    } else if (type == "str") {
      return val;
    } else {
      return +val;
    }
  } else if (type == "select" || type == "multiselect") {
    selected = [];
    for (i = 0; i < activeInputWidget.length; i++) {
      if (activeInputWidget[i].status == 'selected') {
        selected.push(getButtonID(activeInputWidget[i]));
      }
    }
    
    if (type == "select") {
      return selected.length > 0 ? selected[0] : null;
    } else {
      return selected;
    }
  } else if (type == "date") {
    return dateEntryContext.getDate();
  } else if (type == "info") {
    return null;
  }
}

function answerQuestion () {
  gFormAdapter.answerQuestion(getQuestionAnswer());
}

function prevQuestion () {
  gFormAdapter.prevQuestion();
}