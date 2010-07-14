
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

function workflowQuestion () {

}

function workflowQuery () {

}

function workflowAlert () {

}

function workflowAdapter (workflowGenerator) {
  this.wf = workflowGenerator;

  this.wf_inst = null;
  this.history = null;
  this.active_question = null;

  this.loadForm = function () {
    this.wf_inst = this.wf();
    this.history = [];
    this.active_question = null;

    this._jumpNext();
  }

  this.answerQuestion = function (answer) {
    this.active_question.value = answer;
    this.history.push(answer);
    this._jumpNext();
  }

  this.prevQuestion = function () {
    if (this.history.length == 0)
      return;

    this.wf_inst = this.wf();
    for (var i = 0; i < this.history.length; i++) {
      ev = this._getNext();
      if (i < this.history.length - 1) {
        ev.value = this.history[i];
      } else {
        ev.defaultAnswer = this.history[i];
        renderQuestion(ev, false);
      }
      this.history.pop();
    }
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
    } else if (ev instanceof workflowQuestion) {
      this.active_question = ev;
      renderQuestion(ev, true);
    } else if (ev instanceof workflowQuery) {
      ev.eval();
      this.history.push(ev.value);
      this._jumpNext();
    } else if (ev instanceof workflowAlert) {
      //not handled
    }
  }

  this._formComplete () {
    alert("i'm done!");
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
    return answerText.child.control.value;
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


