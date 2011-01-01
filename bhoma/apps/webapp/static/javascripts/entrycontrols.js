/* === INHERITANCE PATTERN === */

function inherit (subclass, superclass) {
  subclass._super = superclass._super || {};
  for (var e in superclass) {
    if (e != '_super' && e != 'super') {
      if (typeof(superclass[e]) != 'function') {
        subclass[e] = superclass[e];
      } else {
        if (subclass._super[e] == null) {
          subclass._super[e] = [];
        }
        subclass._super[e].push(superclass[e]);
        subclass[e] = passToParent(e);
      }
    }
  }
  subclass.super = function (funcName) {
    return invokeSuper(this, funcName);
  }
}

function passToParent (funcName) {
  return function () {
    return this.super(funcName).apply(null, arguments);
  }
}

function invokeSuper (self, funcName) {
  return function () {
    var basefunc = self._super[funcName].pop();
    if (!basefunc) {
      throw new Error('function ' + funcName + ' not defined in superclass');
    }
    var retval = basefunc.apply(self, arguments);
    self._super[funcName].push(basefunc);
    return retval;
  }
}

/* ============================= */


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

  this.setAnswer = function (answer, postLoad) {
    var control = this.getControl();
    if (control) {
      control.value = (answer != null ? answer : '');
    } else {
      this.default_answer = answer;
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

  this.typeFunc = function (no_flash) {
    flash = no_flash || false;
    var self = this;
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
    return this.super('typeFunc')(true);
  }
}

function IntEntry () {
  inherit(this, new FreeTextEntry({domain: 'numeric', length_limit: 9}));

  this.getAnswer = function () {
    var val = this.super('getAnswer')();
    return (val != null ? +val : val);
  }
}

function FloatEntry () {
  inherit(this, new FreeTextEntry({}));

  this.getAnswer = function () {
    var val = this.super('getAnswer')();
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

  this.setAnswer = function (answer, postLoad) {
    this.super('setAnswer')(!postLoad && !answer ? CLINIC_PREFIX : answer, postLoad);
  }
}

function MultiSelectEntry (args) {
  inherit(this, new SimpleEntry());

  this.choices = args.choices;
  this.choicevals = args.choicevals;

  this.isMulti = true;
  this.buttons = null;
  this.default_selections = null;

  this.load = function () {
    var choiceLayout = this.makeChoices();
    questionEntry.update(choiceLayout);
    this.buttons = choiceLayout.buttons;
  }

  this.makeChoices = function () {
    return new ChoiceSelect({choices: this.choices, choicevals: this.choicevals, selected: this.default_selections, multi: this.isMulti, action: this.selectFunc()});
  }

  this.getAnswer = function () {
    var selected = [];
    for (i = 0; i < this.buttons.length; i++) {
      if (this.buttons[i].status == 'selected') {
        selected.push(this.buttons[i].value);
      }
    }
    return selected;
  }

  //answer is null or list
  this.setAnswer = function (answer, postLoad) {
    if (this.buttons) {
      for (var i = 0; i < this.buttons.length; i++) {
        var button = this.buttons[i];
        button.setStatus(answer != null && answer.indexOf(button.value) != -1 ? 'selected': 'default');
      }
    } else {
      this.default_selections = answer;
    }
  }

  this.selectFunc = function () {
    return function (ev, c, button) { button.toggleStatus(); }
  }
}

function SingleSelectEntry (args) {
  inherit(this, new MultiSelectEntry(args));

  this.isMulti = false;

  this.getAnswer = function () {
    var selected = this.super('getAnswer')();
    return selected.length > 0 ? selected[0] : null;
  }

  this.setAnswer = function (answer, postLoad) {
    this.super('setAnswer')(answer != null ? [answer] : null, postLoad);
  }

  this.selectFunc = function () {
    var togglefunc = this.super('selectFunc')();
    var self = this;
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

function DateEntry (dir, args) {
  inherit(this, new Entry());

  this.dir = dir;
  this.context = new DateWidgetContext(args);

  this.load = function () {
    this.context.refresh();
  }

  this.setAnswer = function (answer, postLoad) {
    this.context.init(answer, this.dir || postLoad);
    if (postLoad) {
      this.context.refresh();
    }
  }

  this.getAnswer = function () {
    return this.context.getDate();
  }

  this.next = function () {
    this.context.next();
  }

  this.back = function () {
    this.context.back();
  }
}
