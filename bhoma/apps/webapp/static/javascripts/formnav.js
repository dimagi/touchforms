

function loadForm (formName) {
  jQuery.post(XFORM_URL, JSON.stringify({'action': 'new-form', 'form-name': formName}), function (resp) {
    gSessionID = resp["session_id"];
    renderEvent(resp["event"], true);
  }, "json");
}

function renderEvent (event, dirForward) {
  if (event["type"] == "question") {
    renderQuestion(event, dirForward);
  } else if (event["type"] == "form-complete") {
    formComplete(event);
  } else if (event["type"] == "sub-group") {
    if (event["repeatable"]) {
      alert("i can't support repeats right now!");
    }
  
    jQuery.post(XFORM_URL, JSON.stringify({'action': (dirForward ? 'next' : 'back'), 'session-id': gSessionID}), function (resp) {
      renderEvent(resp["event"], dirForward || resp["at-start"]);
    }, "json");
  } else {
    alert("unrecognized event [" + event["type"] + "]");
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
    freeEntryKeyboard.update(event["datatype"] == 'str' ? keyboard : numPad);    
    activeInputWidget = answerText;
    
    if (event["answer"] != null) {
      answerText.setText(event["answer"]);
    }
  } else if (event["datatype"] == "select" || event["datatype"] == "multiselect") {
    selections = (event["datatype"] == "select" ? [event["answer"]] : event["answer"]);
    chdata = choiceSelect(event["choices"], selections);
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
  answer = getQuestionAnswer();
  
  jQuery.post(XFORM_URL, JSON.stringify({'action': 'answer', 'session-id': gSessionID, 'answer': answer}), function (resp) {
    if (resp["status"] == "validation-error") {
      if (resp["type"] == "required") {
        showError("An answer is required");
      } else if (resp["type"] == "constraint") {
        showError(resp["reason"]);      
      }
    } else {
      renderEvent(resp["event"], true);
    }
  }, "json");
}

function prevQuestion () {
  jQuery.post(XFORM_URL, JSON.stringify({'action': 'back', 'session-id': gSessionID}), function (resp) {
    renderEvent(resp["event"], false);
  }, "json");
}

function post_to_url(path, params, method) {
    // hat tip: http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
    method = method || "post"; // Set method to post by default, if not specified.
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

    form.submit();
}

function post_to_url(path, params, method) {
    // hat tip: http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
    method = method || "post"; // Set method to post by default, if not specified.
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

    form.submit();
}
function formComplete (event) {
    // POST the response back to ourselves for further processing
    post_to_url("", event)
}
