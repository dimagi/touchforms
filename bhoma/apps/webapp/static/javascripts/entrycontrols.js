function inherit (subclass, superclass) {
  for (var e in superclass) {
    subclass[e] = superclass[e];
  }
  subclass._parent = superclass;
}

function SimpleEntry () {

}

function FreeTextEntry (args) {
  inherit(this, new SimpleEntry());

  this.domain = args.domain || 'full';
  this.length_limit = args.length_limit || 500;

  this.inputfield = null;

  this.load = function () {
    questionEntry.update(freeEntry);
    var answerBarControls = this.getAnswerBar();
    answerBarControls.inputfield.setMaxLen(this.length_limit);
    answerBar.update(answerBarControls.component);
    freeEntryKeyboard.update(this.getKeyboard());
    this.inputfield = answerBarControls.inputfield;
  }

  this.getControl = function () {
    return (this.inputfield == null ? null : this.inputfield.child.control);
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

  //explicit 'self' parameter needed due to weirdness with javascript 'inheritance'
  this.typeFunc = function (no_flash, self) {
    flash = no_flash || false;
    self = self || this;
    return function (ev, c, button) { type_(self.getControl(), c, button, !no_flash); };
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

}

function FloatEntry () {
  inherit(this, new FreeTextEntry({}));

  this.getKeyboard = function () {
    return makeNumpad('.', this.typeFunc());
  }
}

function PhoneNumberEntry () {
  inherit(this, new FreeTextEntry({length_limit: 15}));

  this.getKeyboard = function () {
    return makeNumpad('+', this.typeFunc());
  }
}

function BloodPressureEntry () {
  inherit(this, new FreeTextEntry({length_limit: 7}));

  this.getKeyboard = function () {
    return makeNumpad('/', this.typeFunc());
  }
}

function PatientIDEntry () {
  inherit(this, new FreeTextEntry({domain: 'numeric', length_limit: 13}));
}
