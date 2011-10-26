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

/* TO USE:
 *
 * early in the constructor of the child class, call:
 *   inherit(this, new SuperClass(...));
 * this is akin to calling super(...); inside a java constructor
 *
 * this call will load all variables and functions from the parent class
 * into this class.
 *
 * add additional variables and methods after the inherit() call. to
 * overload a method in the parent class, simply redefine the function
 * in this class
 *
 * to call a parent method explicitly, do:
 *   this.super('someMethod')(args);
 * this is akin to calling super.someMethod(args); in java
 */

/* ============================= */


function Entry () {
  this.help = function () {
    showError(activeQuestion["help"] || "There is no help text for this question.");
  }

  this.clear = function () {
    this.setAnswer(null, true);
  }
}

function SimpleEntry () {
  inherit(this, new Entry());

  this.shortcuts = [];

  /*
  this.next = function () {
    if (this.prevalidate()) {
      answerQuestion();
    }
  }
  */

  this.prevalidate = function (q) {
    return true;
  }

  this.back = function () {
    prevQuestion();
  }

  this.destroy = function () {
    for (var i = 0; i < this.shortcuts.length; i++) {
      shortcut.remove(this.shortcuts[i]);
    }
  }

  this.add_shortcut = function (hotkey, func) {
    set_shortcut(hotkey, func);
    this.shortcuts.push(hotkey);
  }
}

function InfoEntry (text, dir) {
  inherit(this, new SimpleEntry());

  this.text = text;
  this.dir = dir;

  this.getAnswer = function () {
    return null;
  }

  this.load = function () {
    if (this.dir || showAlertsOnBack()) {
      showError(this.text);
      (this.dir ? nextClicked : backClicked)();
    } else {
      backClicked();
    }
  }
}

function FreeTextEntry (args) {
  inherit(this, new SimpleEntry());

  args = args || {};
  this.domain = args.domain || 'full';
  this.length_limit = args.length_limit || 500;
  this.textarea = args.prose;

  this.inputfield = null;
  this.default_answer = null;

  this.load = function (q, $container) {
    this.mkWidget(q, $container);

    this.setAnswer(this.default_answer);
  }

  this.mkWidget = function (q, $container) {
    if (!this.textarea) {
      $container.html('<input id="textfield" maxlength="' + this.length_limit + '" type="text" style="width: ' + this.widgetWidth() + '" /><span id="type" style="margin-left: 15px; font-size: x-small; font-style: italic; color: grey;">(' + this.domainText() + ')</span>');
      var widget = $container.find('#textfield');
    } else {
      $container.html('<textarea id="textarea" style="width: 33em; height: 10em; font-family: sans-serif;"></textarea>');
      var widget = $container.find('#textarea');

      /*
      var type_newline = function() {
        //TODO: doesn't work in chrome
        var evt = document.createEvent("KeyboardEvent");
        evt.initKeyEvent("keypress", true, true, window,
                         0, 0, 0, 0,
                         13, 0); 
        widget[0].dispatchEvent(evt);
      }

      this.add_shortcut('ctrl+enter', type_newline);
      this.add_shortcut('shift+enter', type_newline);
      this.add_shortcut('alt+enter', type_newline);
      */
    }
    //widget.focus();
    this.inputfield = widget[0];
    widget.change(function() { q.onchange(); });
  }

  this.getControl = function () {
    return this.inputfield;
  }

  this.getRaw = function () {
    var control = this.getControl();
    return (control != null ? control.value : null);
  }

  this.getAnswer = function () {
    var raw = $.trim(this.getRaw());
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

  this.prevalidate = function (q) {
    var raw = this.getRaw();
    if (raw) {
      var errmsg = this._prevalidate(raw);
      if (errmsg) {
        q.showError(errmsg);
        return false;
      }
    }
    return true;
  }

  this._prevalidate = function (raw) {
    return null;
  }

  this.domainText = function() {
    return 'free-text';
  }

  this.widgetWidth = function() {
    return '20em';
  }
}

function PasswordEntry (args) {
  args.length_limit = args.length_limit || 9;
  inherit(this, new FreeTextEntry(args));

  this.mkWidget = function () {
    $('#answer')[0].innerHTML = '<input id="textfield" maxlength="' + this.length_limit + '" type="passwd"/>';
    this.inputfield = $('#textfield')[0];
  }
}

function IntEntry (parent, length_limit) {
  inherit(this, new FreeTextEntry({parent: parent, domain: 'numeric', length_limit: length_limit || 9}));

  this.getAnswer = function () {
    var val = this.super('getAnswer')();
    return (val != null ? +val : val);
  }

  this._prevalidate = function(raw) {
    return (isNaN(+raw) || +raw != Math.floor(+raw) ? "Not a valid whole number" : null);
  }

  this.domainText = function() {
    return 'numeric';
  }

  this.widgetWidth = function() {
    return '8em';
  }
}

function FloatEntry (parent) {
  inherit(this, new FreeTextEntry({parent: parent}));

  this.getAnswer = function () {
    var val = this.super('getAnswer')();
    return (val != null ? +val : val);
  }

  this._prevalidate = function (raw) {
    return (isNaN(+raw) ? "Not a valid number" : null);
  }

  this.domainText = function() {
    return 'decimal';
  }

  this.widgetWidth = function() {
    return '8em';
  }
}

function MultiSelectEntry (args) {
  inherit(this, new SimpleEntry());

  this.choices = args.choices;
  this.choicevals = args.choicevals;
  this.layout_override = args.layout_override;
  this.as_single = (args.meta || {}).as_single;

  this.isMulti = true;
  //this.buttons = null;
  this.default_selections = null;

  this.$container = null;

  this.init_vals = function () {
    if (this.choicevals == null && typeof this.choices[0] == 'object') {
      this.choicevals = [];
      for (var i = 0; i < this.choices.length; i++) {
        var choice = this.choices[i];
        this.choices[i] = choice.lab;
        this.choicevals.push(choice.val);
      }
    }
  }
  this.init_vals();

  this.load = function (q, $container) {
    this.$container = $container;
    this.group = 'sel-' + nonce();

    content = '';
    for (var i = 0; i < this.choices.length; i++) {
      var label = (i < 10 ? '' + ((i + 1) % 10) : (i < 36 ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i - 10] : null));
      content += label + ') <input id="ch-' + i + '" type="' + (this.isMulti ? 'checkbox' : 'radio') + '" name="' + this.group + '" value="' + i + '"> ' + this.choices[i] + '<br>';

      //this.add_shortcut(label, this.selectFunc(i));
    }
    $container.html(content);
    $container.append('<a id="clear" href="#">clear</a>');
    //$('#ch-0').focus();

    //var self = this;
    //this.add_shortcut('up', function() { self.scroll(false); });
    //this.add_shortcut('down', function() { self.scroll(true); });

    this.initted = true;

    this.setAnswer(this.default_selections);

    //this mode is foolproof, but submits a new answer every time you change the selection
    //$container.find('input').click(function() { q.onchange(); });

    //this mode only submits once you 'leave' the question, but may have holes
    $container.find('input').blur(function() {
        setTimeout(function() {
            var left = ($container.has(':focus').length == 0);
            if (left) {
              q.onchange();
            }
          }, 50); //SKETCH! the new element with focus is not available directly in the blur() event
      });

    $container.find('#clear').click(function () {
        $container.find('input').removeAttr('checked');
        q.onchange();
        return false;
      });
  }

  this.getAnswer = function () {
    var selected = [];
    for (i = 0; i < this.choices.length; i++) {
      if (this.choiceWidget(i, true).checked) {
        selected.push(this.valAt(i));
      }
    }
    return selected;
  }

  this.valAt = function (i) {
    return (this.choicevals != null ? this.choicevals[i] : i + 1);
  }

  //answer is null or list
  this.setAnswer = function (answer, postLoad) {
    if (this.initted) {
      for (var i = 0; i < this.choices.length; i++) {
        var button = this.choiceWidget(i, true);
        var checked = (answer != null && answer.indexOf(this.valAt(i)) != -1);
        button.checked = checked;
        if (checked) {
          //  this.choiceWidget(i).focus();
        }
      }
    } else {
      this.default_selections = answer;
    }
  }

  this.selectFunc = function (i) {
    var self = this;
    return function () {
      var cbox = this.choiceWidget(i); //is 'this' a bug? (used for keyboard shortcuts?)
      if (cbox.is(':checked')) {
        cbox.removeAttr('checked');
      } else {
        cbox.attr('checked', true);
      }
      cbox.focus();
    }
  }

  this.scroll = function (dir) {
    var checkboxes = [];
    for (var i = 0; i < this.choices.length; i++) {
      checkboxes.push(this.choiceWidget(i, true));
    }
    var focussed = $(':focus');
    var activeIx = -1;
    for (var i = 0; i < focussed.length; i++) {
      var ix = checkboxes.indexOf(focussed[i]);
      if (ix != -1) {
        activeIx = ix;
        break;
      }
    }
    if (activeIx >= 0) {
      var newIx = (activeIx + this.choices.length + (dir ? 1 : -1)) % this.choices.length;
      this.focus(newIx);
    }
  }

  this.focus = function(i) {
    this.choiceWidget(i).focus();
  }

  this.choiceWidget = function(i, dom) {
    var elem = this.$container.find('#ch-' + i);
    return (dom ? elem[0] : elem);
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
    if (this.initted) {
      this.super('setAnswer')(answer != null ? [answer] : null, postLoad);
    } else {
      this.default_selections = answer;
    }
  }

  this.selectFunc = function (i) {
    var self = this;
    return function () {
      var cbox = this.choiceWidget(i); //is 'this' a bug? (used for keyboard shortcuts?)
      cbox.attr('checked', true);
      //      cbox.focus();
    }
  }
}

/*
function clearButtons (buttons, except_for) {
  for (var i = 0; i < buttons.length; i++) {
    if (buttons[i] != except_for) {
      buttons[i].resetStatus();
    }
  }
}
*/

function DateEntry (args) {
  inherit(this, new SimpleEntry());

  this.format = 'mm/dd/yy';

  this.$picker = null;

  this.load = function (q, $container) {
    this.widget_id = 'datepicker-' + nonce();
    $container.html('<input id="' + this.widget_id + '" type="text"><span id="type" style="margin-left: 15px; font-size: x-small; font-style: italic; color: grey;">(' + this.format.replace('yy', 'yyyy') + ')</span>');
    this.$picker = $container.find('#' + this.widget_id);

		this.$picker.datepicker({
        changeMonth: true,
        changeYear: true,
        dateFormat: this.format
      });

    this.initted = true;

    this.setAnswer(this.def_ans);

    this.$picker.change(function() { q.onchange(); });
  }

  this.setAnswer = function (answer, postLoad) {
    if (this.initted) {
      this.$picker.datepicker('setDate', answer ? $.datepicker.parseDate('yy-mm-dd', answer) : null);
      this.ans = answer;
    } else {
      this.def_ans = answer;
    }

  }

  this.getAnswer = function () {
    var raw = this.$picker.datepicker('getDate');
    return (raw != null ? $.datepicker.formatDate('yy-mm-dd', raw) : null);
  }

}

function TimeOfDayEntry () {
  this.HOUR_MAX = 23;
  this.MINUTE_MAX = 59;

  inherit(this, new CompoundNumericEntry());

  this.get_field_info = function () {
    return [
      {args: {min: 0, max: this.HOUR_MAX, paddisplay: true}, label: 'h'},
      {args: {min: 0, max: this.MINUTE_MAX, fixedwidth: true}, label: 'm'}
    ];
  }

  this.make_answerbar = function () {
    var timeSpacer = new TextCaption({color: TEXT_COLOR, caption: ':', size: 1.7});
    var content = [this.fields[0], timeSpacer, this.fields[1]];
    var widths = ['1.3@', '.3@', '1.3@'];
    return make_answerbar(content, widths, 'time-bar');
  }

  this.parseAnswer = function (answer) {
    var match = /^([0-9]+) *\: *([0-9]+)$/.exec(answer);
    if (!match) {
      return null;
    } else {
      return [+match[1], +match[2]];
    }
  }

  this.formatAnswer = function (answer) {
    return answer[0] + ':' + answer[1];
  }

  this.outOfRangeMsg = function () {
    return 'Time of day must be between 00:00 and 23:59';
  }

  this.completeCurrentFieldMsg = function (field) {
    return 'Enter ' + ['an hour', 'a minute'][field];
  }
}

function renderQuestion (q, $container, init_answer) {
  var control = null;

  /*
  if (q.datatype == 'info') {
    control = new InfoEntry(event["caption"], dir);
    control.load();
    return control;
  }
  */

  q.domain_meta = q.domain_meta || {};

  if (q.customlayout != null) {
    control = q.customlayout();
  } else if (q.datatype == "str") {
    control = new FreeTextEntry({domain: q.domain, prose: q.domain_meta.longtext});
  } else if (q.datatype == "int") {
    control = new IntEntry();
  } else if (q.datatype == "float") {
    control = new FloatEntry();
  //  } else if (q.datatype == "passwd") {
  //control = new PasswordEntry({domain: q.domain});
  } else if (q.datatype == "select") {
    control = new SingleSelectEntry({choices: q.choices, choicevals: q.choicevals});
  } else if (q.datatype == "multiselect") {
    control = new MultiSelectEntry({choices: q.choices, choicevals: q.choicevals, meta: q.domain_meta});
  } else if (q.datatype == "date") {
    control = new DateEntry(q.domain_meta);
  //} else if (q.datatype == "time") {
  //control = new TimeOfDayEntry();
  } else {
    // unrecognized datatype
    console.log('unrecognized datatype');

    //renderQuestion({'datatype': 'info', 'caption': 'Touchforms cannot yet support "' + event["datatype"] + '" questions. This question will be skipped.'}, dir);
    return;
  }

  if (control == null) {
    console.log('no active control');
    return null;
  }

  control.setAnswer(init_answer);
  control.load(q, $container);
  return control;
}

function nonce() {
  return Math.floor(Math.random()*1e9);
}