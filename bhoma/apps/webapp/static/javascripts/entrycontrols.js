function inherit (subclass, superclass) {
  for (var e in superclass) {
    subclass[e] = superclass[e];
  }
  subclass._parent = superclass;
}

function Entry () {
  this.help = function () {
    overlay.activate({
        text: activeQuestion["help"] || "There is no help text for this question.",
        color: HELP_BGCOLOR,
        timeout: 15.
      });
  }

  this.clear = function () {
    this.setAnswer(null, true);
  }
}

function SimpleEntry () {
  inherit(this, new Entry());

  this.next = function () {
    if (this.prevalidate()) {
      answerQuestion();
    }
  }

  this.prevalidate = function () {
    return true;
  }

  this.back = function () {
    prevQuestion();
  }
}

function FreeTextEntry (args) {
  inherit(this, new SimpleEntry());

  this.domain = args.domain || 'full';
  this.length_limit = args.length_limit || 500;

  this.inputfield = null;
  this.default_answer = null;

  this.load = function () {
    questionEntry.update(freeEntry);
    var answerBarControls = this.getAnswerBar();
    answerBarControls.inputfield.setMaxLen(this.length_limit);
    answerBar.update(answerBarControls.component);
    freeEntryKeyboard.update(this.getKeyboard());
    this.inputfield = answerBarControls.inputfield;
    this.setAnswer(this.default_answer);
  }

  this.getControl = function () {
    return (this.inputfield == null ? null : this.inputfield.child.control);
  }

  this.getRaw = function () {
    var control = this.getControl();
    return (control != null ? control.value : null);
  }

  this.getAnswer = function () {
    var raw = this.getRaw();
    return (raw == '' ? null : raw);
  }

  //'self' parameter is needed to circumvent javascript 'inheritance' shortcomings
  this.setAnswer = function (answer, self) {
    self = self || this;
    var control = self.getControl();
    if (control) {
      control.value = (answer != null ? answer : '');
    } else {
      self.default_answer = answer;
    }
  }

  this.getAnswerBar = function () {
    var answerText = new InputArea({id: 'textinp', border: 3, padding: 5, child: new TextInput({textsize: 1.2, align: 'left', spacing: 0})});  
    var freeTextAnswer = make_answerbar(answerText, '*', 'answer-bar');

    return {
      component: freeTextAnswer,
      inputfield: answerText
    };
  }

  this.getKeyboard = function () {
    return kbdForDomain(this.domain, this.typeFunc());
  }

  //'self' parameter is needed to circumvent javascript 'inheritance' shortcomings
  this.typeFunc = function (no_flash, self) {
    flash = no_flash || false;
    self = self || this;
    return function (ev, c, button) { type_(self.getControl(), c, button, !no_flash); };
  }

  this.prevalidate = function () {
    var raw = this.getRaw();
    if (raw) {
      var errmsg = this._prevalidate(raw);
      if (errmsg) {
        showError(errmsg);
        return false;
      }
    }
    return true;
  }

  this._prevalidate = function (raw) {
    return null;
  }
}

function kbdForDomain (domain, typefunc) {
  if (domain == 'full') {
    return makeKeyboard(true, typefunc);
  } else if (domain == 'alpha') {
    return makeKeyboard(false, typefunc);
  } else if (domain == 'numeric') {
    return makeNumpad(null, typefunc);
  }
}

function PasswordEntry (args) {
  args.length_limit = args.length_limit || 9;
  inherit(this, new FreeTextEntry(args));

  this.getAnswerBar = function () {
    var passwdText = new InputArea({id: 'textinp', border: 3, padding: 5, child: new TextInput({textsize: 1.3, spacing: 0, passwd: true})});
    var passwdAnswer = make_answerbar(passwdText, '5@', 'passwd-bar');

    return {
      component: passwdAnswer,
      inputfield: passwdText
    };
  }

  this.typeFunc = function () {
    //turn off keyflash
    return this._parent.typeFunc(true, this);
  }
}

function IntEntry () {
  inherit(this, new FreeTextEntry({domain: 'numeric', length_limit: 9}));

  this.getAnswer = function () {
    var val = this._parent.getAnswer();
    return (val != null ? +val : val);
  }
}

function FloatEntry () {
  inherit(this, new FreeTextEntry({}));

  this.getAnswer = function () {
    var val = this._parent.getAnswer();
    return (val != null ? +val : val);
  }

  this.getKeyboard = function () {
    return makeNumpad('.', this.typeFunc());
  }

  this._prevalidate = function (raw) {
    return (isNaN(+raw) ? "Not a valid number" : null);
  }
}

function PhoneNumberEntry () {
  inherit(this, new FreeTextEntry({length_limit: 15}));

  this.getKeyboard = function () {
    return makeNumpad('+', this.typeFunc());
  }

  this._prevalidate = function (raw) {
    return (!(/^\+?[0-9]+$/.test(raw)) ? "This does not appear to be a valid phone number" : null);
  }
}

function BloodPressureEntry () {
  inherit(this, new FreeTextEntry({length_limit: 7}));

  this.getKeyboard = function () {
    return makeNumpad('/', this.typeFunc());
  }

  this._prevalidate = function (raw) {
    var match = /^([0-9]+)\/([0-9]+)$/.exec(raw);
    if (!match) {
      return "This does not appear to be a valid blood pressure reading. Blood pressure should look like: 120/80";
    }

    syst = +match[1];
    diast = +match[2];
    if (syst > 300 || syst < 40 || diast > 210 || diast < 20) {
      return "Blood pressure must be between 40/20 and 300/210";
    }

    return null;
  }
}

function PatientIDEntry () {
  inherit(this, new FreeTextEntry({domain: 'numeric', length_limit: 13}));

  this.setAnswer = function (answer, clearClicked) {
    this._parent.setAnswer(!clearClicked && !answer ? CLINIC_PREFIX : answer, this);
  }
}

function MultiSelectEntry (args) {
  inherit(this, new SimpleEntry());

  this.choices = args.choices;
  this.choicevals = args.choicevals;

  this.buttons = null;
  this.default_selections = null;

  this.load = function () {
    var choiceLayout = this.getChoices();
    questionEntry.update(choiceLayout);
    this.buttons = choiceLayout.buttons;
  }

  this.getChoices = function () {
    return this.makeChoices(true);
  }

  this.makeChoices = function (multi) {
    return new ChoiceSelect({choices: this.choices, choicevals: this.choicevals, selected: this.default_selections, multi: multi, action: this.selectFunc()});
  }

  //'self' parameter is needed to circumvent javascript 'inheritance' shortcomings
  this.getAnswer = function (self) {
    self = self || this;
    var selected = [];
    for (i = 0; i < self.buttons.length; i++) {
      if (self.buttons[i].status == 'selected') {
        selected.push(self.buttons[i].value);
      }
    }
    return selected;
  }

  //'self' parameter is needed to circumvent javascript 'inheritance' shortcomings
  //answer is null or list
  this.setAnswer = function (answer, self) {
    self = self || this;
    if (self.buttons) {
      for (var i = 0; i < self.buttons.length; i++) {
        var button = self.buttons[i];
        button.setStatus(answer != null && answer.indexOf(button.value) != -1 ? 'selected': 'default');
      }
    } else {
      self.default_selections = answer;
    }
  }

  this.selectFunc = function () {
    return function (ev, c, button) { button.toggleStatus(); }
  }
}

function SingleSelectEntry (args) {
  inherit(this, new MultiSelectEntry(args));

  this.getChoices = function () {
    return this.makeChoices(false);
  }

  //'self' parameter is needed to circumvent javascript 'inheritance' shortcomings
  this.getAnswer = function (self) {
    var selected = this._parent.getAnswer(self || this);
    return selected.length > 0 ? selected[0] : null;
  }

  this.setAnswer = function (answer) {
    this._parent.setAnswer(answer != null ? [answer] : null, this);
  }

  this.selectFunc = function (self) {
    var togglefunc = this._parent.selectFunc();
    var self = self || this;
    return function (ev, c, button) {
      var oldstatus = button.status;
      togglefunc(ev, c, button);
      clearButtons(self.buttons, button);
      if (oldstatus == 'default') {
        autoAdvanceTrigger();
      }
    }
  }
}

function clearButtons (buttons, except_for) {
  for (var i = 0; i < buttons.length; i++) {
    if (buttons[i] != except_for) {
      buttons[i].resetStatus();
    }
  }
}

function DateEntry () {
  inherit(this, new Entry());

  this.next = function () {
    dateEntryContext.next();
  }

  this.back = function () {
    dateEntryContext.back();
  }

  this.getAnswer = function () {
    return dateEntryContext.getDate();
  }

    dateEntryContext = new DateWidgetContext(dir, event["answer"], event["domain_meta"]);
    dateEntryContext.refresh();

}

