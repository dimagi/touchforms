

SCREEN_BORDER = '1.1%=!'; //10px @ 1024x768;
SCREEN_MARGIN = '1.1%=!'; //10px @ 1024x768;
SECTION_MARGIN = '0.68%=!';
HEADER_HEIGHT = '8%!';
FOOTER_HEIGHT = '10%!';
FOOTER_BUTTON_WIDTH = '15%!';
FOOTER_BUTTON_SPACING = SECTION_MARGIN;
HELP_BUTTON_SPACING = SECTION_MARGIN;
CHOICE_LAYOUT_GOLDEN_RATIO = 1.2 //should ~= w:h ratio of renderable choice area / w:h ratio of screen (which mainly depends on size of header and footer)

BORDER_COLOR = '#000';
MAIN_COLOR = '#eef';
HEADER_COLOR = '#dde';
FOOTER_COLOR = '#abd';
BUTTON_TEXT_COLOR = '#fff';
TEXT_COLOR = '#000';
KEYBUTTON_COLOR = '#118';
KEYBUTTON_CLASS = 'key-button';
BUTTON_SELECTED_COLOR = '#0bf';
HIGHLIGHT_COLOR = '#ffc';
NUMPAD_COLOR = '#16c';
NUMPAD_CLASS = 'numpad-button';
SPC_COLOR = '#44e';
SPC_CLASS= 'spacebar';


BACKSPACE_CLASS = 'clear-button';


BACKSPACE_LABEL = '\u21d0';

AUTO_ADVANCE_DELAY = 150; //ms

function initStaticWidgets () {
  questionCaption = new TextCaption('q-caption', TEXT_COLOR, '', 1., 'left', 'top');
  
  helpButton = new TextButton({id: 'help-button', color: '#aaa', textcolor: BUTTON_TEXT_COLOR, caption: '?', textsize: 1., onclick: helpClicked});
  backButton = new TextButton({id: 'back-button', color: '#6ad', textcolor: BUTTON_TEXT_COLOR, caption: 'BACK', textsize: .9, onclick: backClicked});
  homeButton = new TextButton({id: 'home-button', color: '#d23', textcolor: BUTTON_TEXT_COLOR, caption: 'HOME', textsize: .9, onclick: homeClicked});
  nextButton = new TextButton({id: 'next-button', color: '#1a3', textcolor: BUTTON_TEXT_COLOR, caption: 'NEXT', textsize: 1.2, onclick: nextClicked});
  
  questionEntry = new Indirect();
  
  overlay = new Overlay('#d66', HEADER_COLOR, 3., 2., '');
  touchscreenUI = new Top(
    // main content
    new Layout({id: 'main', nrows: 3, heights: [HEADER_HEIGHT, '*', FOOTER_HEIGHT], margins: SCREEN_BORDER, color: MAIN_COLOR, margin_color: BORDER_COLOR, content: [
      new Layout({id: 'header', margins: [SCREEN_MARGIN, SCREEN_MARGIN, SCREEN_MARGIN, SECTION_MARGIN], color: HEADER_COLOR, margin_color: '-', content: [
        new Layout({id: 'top-bar', ncols: 2, widths: ['*', '1.1@'], heights: '@', spacings: HELP_BUTTON_SPACING, content: [
          questionCaption,
          helpButton
        ]})
      ]}),
      new Layout({id: 'entry', margins: [SCREEN_MARGIN, 0], content: [questionEntry]}),
      new Layout({id: 'footer', ncols: 4, widths: [FOOTER_BUTTON_WIDTH, FOOTER_BUTTON_WIDTH, '*', FOOTER_BUTTON_WIDTH], 
                 margins: [SCREEN_MARGIN, SCREEN_MARGIN, SECTION_MARGIN, SCREEN_MARGIN], spacings: FOOTER_BUTTON_SPACING, color: FOOTER_COLOR, margin_color: '-', spacing_color: '-', content: [
        backButton, 
        homeButton,
        null, // progress bar 
        nextButton
      ]}),
    ]})
  ,
    //notifications overlay
    overlay
  );

  answerBar = new Indirect();
  freeEntryKeyboard = new Indirect();
  freeEntry = new Layout({id: 'free-entry', nrows: 2, heights: ['18%', '*'], content: [
    answerBar,
    new Layout({id: 'kbd', margins: ['1.5%=', '1.5%=', 0, '.75%='], content: [freeEntryKeyboard]})
  ]});

  makeNumpad = function (extraKey) {
    return aspect_margin('1.7%-',
        new Layout({id: 'numpad', nrows: 4, ncols: 3, widths: '7@', heights: '7@', margins: '*', spacings: '@', 
                    content: kbs(['1', '2', '3', '4', '5', '6', '7', '8', '9', extraKey, '0', {label: BACKSPACE_LABEL, style: BACKSPACE_CLASS}], {textsize: 2., action: type_})})
      );
  }

  numPad = makeNumpad();
  numPadDecimal = makeNumpad('.');
  numPadPhone = makeNumpad('+');
  numPadBP = makeNumpad('/');
  
  if (kbdQwerty) {
    kbdFull = [
      'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', {label: '7', style: NUMPAD_CLASS}, {label: '8', style: NUMPAD_CLASS}, {label: '9', style: NUMPAD_CLASS},
      'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '?', {label: '4', style: NUMPAD_CLASS}, {label: '5', style: NUMPAD_CLASS}, {label: '6', style: NUMPAD_CLASS},
      'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '!', {label: '1', style: NUMPAD_CLASS}, {label: '2', style: NUMPAD_CLASS}, {label: '3', style: NUMPAD_CLASS},
      '\u2013', '+', '%', '&', '*', '/', ':', ';', '(', ')', {label: '', style: SPC_CLASS}, {label: '0', style: NUMPAD_CLASS}, {label: BACKSPACE_LABEL, style: BACKSPACE_CLASS}     
    ];
    kbdAlpha = [
      'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
      'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', {label: BACKSPACE_LABEL, style: BACKSPACE_CLASS},
      'Z', 'X', 'C', 'V', 'B', 'N', 'M', '\u2013', '\'', ''
    ];
  } else {
    kbdFull = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', {label: '7', style: NUMPAD_CLASS}, {label: '8', style: NUMPAD_CLASS}, {label: '9', style: NUMPAD_CLASS}, {label: BACKSPACE_LABEL, style: BACKSPACE_CLASS},
      'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', {label: '4', style: NUMPAD_CLASS}, {label: '5', style: NUMPAD_CLASS}, {label: '6', style: NUMPAD_CLASS}, '.',
      'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', {label: '', style: SPC_CLASS}, {label: '1', style: NUMPAD_CLASS}, {label: '2', style: NUMPAD_CLASS}, {label: '3', style: NUMPAD_CLASS}, ',',
      '\u2013', '+', '%', '&', '*', '/', ':', ';', '(', ')', {label: '0', style: NUMPAD_CLASS}, '!', '?'     
    ];
    kbdAlpha = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', {label: BACKSPACE_LABEL, style: BACKSPACE_CLASS},
      'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', '',
      'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '\u2013', '\''
    ];
  }

  keyboard = new Layout({id: 'text-kbd', nrows: 4, ncols: 13, widths: '4@', heights: '5@', margins: '*', spacings: '0.36@', content: kbs(kbdFull, {textsize: 1.4, action: type_})});
  keyboardAlphaOnly = new Layout({id: 'text-kbd', nrows: 3, ncols: 10, widths: '4@', heights: '5@', margins: '*', spacings: '0.36@', content: kbs(kbdAlpha, {textsize: 1.9, action: type_})});

  //append a 'clear' button to input field(s) and size appropriately
  function make_answerbar (content, widths, id) {
    if (!(content instanceof Array)) {
      content = [content];
    }
    if (!(widths instanceof Array)) {
      widths = [widths];
    }

    //todo: find a way to generalize this?
    var expands = false;
    for (var i = 0; i < widths.length; i++) {
      if (widths[i].indexOf('*') != -1) {
        expands = true;
        break;
      }
    }

    var clearButton = new TextButton({id: 'clear-button', color: '#aaa', textcolor: BUTTON_TEXT_COLOR, caption: 'CLEAR', textsize: 0.8, onclick: clearClicked});
    content.push(clearButton);
    widths.push('1.7@');

    return new Layout({margins: ['3%', '18%'], content: [
         new Layout({id: id, ncols: content.length, heights: '@', widths: widths, margins: [expands ? 0 : '*', '*'], spacings: '.08@', content: content})
       ]});
  }

  answerText = new InputArea('textinp', 3, '#000', 5, '#fff', new TextInput('', '#000', null, '', 1.2, 'left', 0));  
  freeTextAnswer = make_answerbar(answerText, '*', 'answer-bar');

  passwdText = new InputArea('textinp', 3, '#000', 5, '#fff', new TextInput('', '#000', null, '', 1.3, 'center', 0, true));
  passwdAnswer = make_answerbar(passwdText, '5@', 'passwd-bar');
  
  dayText = new InputArea('dayinp', 3, '#000', 0, '#fff', new TextCaption('', TEXT_COLOR, '06', 1.6, 'center', 'middle'), function () {dateEntryContext.goto_('day');});
  monthText = new InputArea('monthinp', 3, '#000', 0, '#fff', new TextCaption('', TEXT_COLOR, 'Oct', 1.6, 'center', 'middle'), function () {dateEntryContext.goto_('month');});
  yearText = new InputArea('yearinp', 3, '#000', 0, '#fff', new TextCaption('', TEXT_COLOR, '20\u2022\u2022', 1.6, 'center', 'middle'), function () {dateEntryContext.goto_('year');});  
  var dateSpacer = function () { return new TextCaption('q-caption', TEXT_COLOR, '\u2013', 1.7, 'center', 'middle'); };
  dateAnswer = make_answerbar([dayText, dateSpacer(), monthText, dateSpacer(), yearText], ['1.3@', '.5@', '1.85@', '.5@', '2.3@'], 'date-bar');

}

var clicksEnabled;
var clickDisableCounter = 0;
function setup () {
  SCREEN_WIDTH = $('#viewport')[0].clientWidth;
  SCREEN_HEIGHT = $('#viewport')[0].clientHeight;

  $('#staging')[0].style.top = (SCREEN_HEIGHT + 500) + 'px';
  $('#staging')[0].style.width = (1.5 * SCREEN_WIDTH) + 'px';
  $('#staging')[0].style.height =  '600px';

  clicksEnabled = true;
  $('body')[0].addEventListener('click', function (ev) {
      if (!clicksEnabled) {
        ev.stopPropagation();
        return false; 
      } else {
        return true;
      }
    }, true);
}

function disableInput() {
  clicksEnabled = false;
  clickDisableCounter++;
}

function enableInput(force) {
  clickDisableCounter--;

  if (clickDisableCounter < 0 || force) {
    clickDisableCounter = 0;
  }

  if (clickDisableCounter == 0) {
    clicksEnabled = true;
  }
}

function helpClicked (ev, x) {
  overlay.setText(activeQuestion["help"] || "There is no help text for this question.");
  overlay.setBgColor('#6d6');
  overlay.setTimeout(15.);
  overlay.setDismiss(null);
  overlay.setActive(true);
}

function backClicked (ev, x) {
  if (activeQuestion["datatype"] == 'date') {
    dateEntryContext.back();
  } else {
    prevQuestion();
  }
}

function homeClicked (ev, x) {
  captions = gFormAdapter.quitWarning();

  showActionableAlert(captions.main,
                      [captions.quit, captions.cancel],
                      [function () {goHome();}, null]);
}

function goHome () {
  if (gFormAdapter.abort) {
    gFormAdapter.abort();
  } else {
    //console.log('warning: workflow has no abort() method; returning to root page');
    location.href='/';
  }
}

function nextClicked (ev, x) {
  if (activeQuestion["datatype"] == 'date') {
    dateEntryContext.next();
    return;
  } else if (activeQuestion["datatype"] == 'float' && answerText.child.control.value != '' && isNaN(+answerText.child.control.value)) {
    showError("Not a valid number");
    return;
  } else if (activeQuestion["domain"] == 'phone' && answerText.child.control.value != '' && !(/^\+?[0-9]+$/.test(answerText.child.control.value))) {
    showError("This does not appear to be a valid phone number");
    return;
  } else if (activeQuestion["domain"] == 'bp' && answerText.child.control.value != '') {
    var val = answerText.child.control.value;
    var match = /^([0-9]+)\/([0-9]+)$/.exec(val);
    if (!match) {
      showError("This does not appear to be a valid blood pressure reading. Blood pressure should look like: 120/80");
      return;
    }

    syst = +match[1];
    diast = +match[2];
    if (syst > 300 || syst < 40 || diast > 210 || diast < 20) {
      showError("Blood pressure must be between 40/20 and 300/210");
      return;
    }
  }

  answerQuestion();
}

function clearClicked (ev, x) {
  type = activeQuestion["datatype"];
  if (type == "str" || type == "int" || type == "float" || type == "passwd") {
    activeInputWidget.setText('');
  } else if (type == "select" || type == "multiselect") {
    //not handled yet
  } else if (type == "date") {
    dateEntryContext.clear();
  }
}

monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
decades = ['2000\u2014' + ((new Date()).getFullYear() + 1), '1990\u20141999', '1980\u20141989', '1970\u20141979', '1960\u20141969',
	   '1950\u20141959', '1940\u20141949', '1930\u20141939', '1920\u20141929', '1910\u20141919'];
function DateWidgetContext (dir, answer) {
  this.init = function (dir, answer) {
    this.screen = (dir || answer == null ? 'decade' : 'day');
    this.setDate(answer);
  }

  this.setDate = function (datestr) {
    if (datestr == null) {
      this.decade = null;
      this.year = null;
      this.month = null;
      this.day = null;
    } else {
      this.year = +datestr.substring(0, 4);
      month = +datestr.substring(5, 7);
      this.day = +datestr.substring(8, 10);
      this.month = monthNames[month - 1];
      this.decade = this.decadeForYear(this.year);
    }
    this.changed = false;
  }

  this.decadeForYear = function (year) {
    for (i = 0; i < decades.length; i++) {
      startyear = +decades[i].substring(0, 4);
      endyear = +decades[i].substring(5, 9);
      if (startyear <= year && year <= endyear) {
        return [startyear, endyear];
      }
    }
    return null;
  }

  this.isFull = function () {
    return (this.decade != null && this.year != null && this.month != null && this.day != null);
  }

  this.isEmpty = function () {
    return (this.decade == null && this.year == null && this.month == null && this.day == null);
  }

  this.isValid = function () {
    return (this.isFull() && this.day <= daysInMonth(this.month, this.year));
  }

  this.getDate = function () {
    if (this.isFull()) {
      dateout = this.year + '-';
      monthnum = monthNames.indexOf(this.month) + 1;
      dateout += (monthnum < 10 ? '0' : '') + monthnum + '-';
      dateout += (this.day < 10 ? '0' : '') + this.day;
      return dateout;
    } else {
      return null;
    }				   
  }

  this.refresh = function () {
    questionEntry.update(freeEntry);
    answerBar.update(dateAnswer);
    if (this.year != null) {
      yearText.setText(this.year + '');
    } else if (this.decade != null) {
      sstart = this.decade[0] + '';
      send = this.decade[1] + '';
      syear = '';
      for (i = 0; i < 4; i++) {
        if (sstart[i] == send[i]) {
          syear += sstart[i];
        } else {
          break;
        }
      }
      while (syear.length < 4) {
        syear += '\u2022';
      }
      yearText.setText(syear);
    } else {
      yearText.setText('');
    }
    monthText.setText(this.month != null ? this.month : '');
    dayText.setText(this.day != null ? (this.day < 10 ? '0' : '') + this.day : '');

    if (this.screen == 'decade') {
      tmp = decadeSelect();
      selectWidget = tmp.layout;
      activeInputWidget = tmp.buttons;
      this.select(this.decade, this.decade != null ? this.decade[0] + '\u2014' + this.decade[1] : null);
      this.highlight();
    } else if (this.screen == 'year') {
      tmp = yearSelect(this.decade[0], this.decade[1]);
      selectWidget = tmp.layout;
      activeInputWidget = tmp.buttons;
      this.select(this.year);
      this.highlight();
    } else if (this.screen == 'month') {
      tmp = monthSelect();
      selectWidget = tmp.layout;
      activeInputWidget = tmp.buttons;
      this.select(this.month);
      this.highlight();
    } else if (this.screen == 'day') {
      tmp = daySelect(daysInMonth(this.month, this.year));
      selectWidget = tmp.layout;
      activeInputWidget = tmp.buttons;
      this.select(this.day);
      this.highlight();
    }
    freeEntryKeyboard.update(selectWidget);
  }

  this.select = function (val, caption) {
    clearButtons();
    if (val != null) {
      b = getButtonByCaption((caption != null ? caption : val) + '');
      if (b != null) {
        b.setStatus('selected');
      }
    }
  }

  this.highlight = function () {
    yearText.setBgColor(this.screen == 'decade' || this.screen == 'year' ? HIGHLIGHT_COLOR : '#fff');
    monthText.setBgColor(this.screen == 'month' ? HIGHLIGHT_COLOR : '#fff');
    dayText.setBgColor(this.screen == 'day' ? HIGHLIGHT_COLOR : '#fff');
  }

  this.clear = function () {
    if (this.getDate() != null)
      this.changed = true;

    this.decade = null;
    this.year = null;
    this.month = null;
    this.day = null;
    this.screen = 'decade';
    this.refresh();
  }

  this.next = function () {
    if (this.isEmpty() || this.isFull()) {
      if (this.isEmpty() || this.isValid()) {
        answerQuestion();
      } else {
        showError('This is not a valid date.');
      }
    } else {
      currentScreenVal = null;
      for (i = 0; i < activeInputWidget.length; i++) {
        if (activeInputWidget[i].status == 'selected') {
          currentScreenVal = activeInputWidget[i].caption;
          break;
        }
      }
      
      if (currentScreenVal == null) {
        showError('Please pick a ' + (this.screen == 'decade' ? 'year' : this.screen) + '. To skip this question and leave it blank, click \'CLEAR\' first.');
        return;
      } else {
        this.screen = this.getEmptyScreen();
      }
      this.refresh();
    }
  }
  
  this.getEmptyScreen = function () {
    if (this.decade == null) {
      return 'decade';
    } else if (this.year == null) {
      return 'year';
    } else if (this.month == null) {
      return 'month';
    } else if (this.day == null) {
      return 'day';
    } else {
      return null;
    }
  }

  this.getNextScreen = function () {
    screens = ['decade', 'year', 'month', 'day'];
    i = screens.indexOf(this.screen) + 1;
    return (i >= screens.length ? null : screens[i]);
  }

  this.getPrevScreen = function () {
    screens = ['decade', 'year', 'month', 'day'];
    i = screens.indexOf(this.screen) - 1;
    return (i < 0 ? null : screens[i]);
  }

  this.selected = function (field, val) {
    if (field == 'decade') {
      olddecade = this.decade;
      startyear = +val.substring(0, 4);
      endyear = +val.substring(5, 9);
      this.decade = [startyear, endyear];
      if (olddecade == null || olddecade[0] != this.decade[0] || olddecade[1] != this.decade[1]) {
        this.changed = true;
        this.year = null;
      }
    } else if (field == 'year') {
      oldyear = this.year;
      this.year = val;
      if (oldyear != this.year) {
        this.changed = true;
        this.decade = this.decadeForYear(val);
      }
    } else if (field == 'month') {
      oldmonth = this.month;
      this.month = val;
      if (oldmonth != this.month)
        this.changed = true;
    } else if (field == 'day') {
      oldday = this.day;
      this.day = val;
      if (oldday != this.day)
        this.changed = true;
    }
    this.select(val);
    
    if (this.screen == 'day') {
      if (!this.isFull()) {
        this.screen = this.getEmptyScreen();
      } else {
        //stay on current screen; must click 'next' to advance question
      }
    } else {
      this.screen = this.getNextScreen();
    }
    
    this.refresh();

    if (field == 'day' && this.isFull() && autoAdvance) {
      doAutoAdvance();
    }
  }
  
  this.back = function () {
    if (this.isEmpty() || (this.isFull() && !this.changed)) {
      prevQuestion();
    } else {
      pscr = this.getPrevScreen();
      if (pscr != null) {
        this.screen = pscr;
        this.refresh();
      } else {
        prevQuestion();
      }
    }
  }

  this.goto_ = function (field) {
    this.screen = (field == 'year' ? 'decade' : field);
    this.refresh();
  }

  this.init(dir, answer);
}

function isLeap (year) {
  return (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));
}

function daysInMonth (month, year) {
  if (month == null)
    return 31;
  if (year == null && month == 'Feb')
    return 28;

  if (month == 'Feb') {
    return 28 + (isLeap(year) ? 1 : 0);
  } else if (month == 'Apr' || month == 'Jun' || month == 'Sep' || month == 'Nov') {
    return 30;
  } else {
    return 31;
  }
}

function decadeSelected (ev, x) {
  dateEntryContext.selected('decade', x);
}

function yearSelected (ev, x) {
  dateEntryContext.selected('year', x);
}

function monthSelected (ev, x) {
  dateEntryContext.selected('month', x);
}

function daySelected (ev, x) {
  dateEntryContext.selected('day', x);
}

function normcap (caption) {
  if (caption.length >= 2 && (caption.substring(0, 1) == '\u2610' || caption.substring(0, 1) == '\u2612')) {
    return caption.substring(2);
  } else {
    return caption;
  }
}

function getButtonByCaption (caption) {
  for (i = 0; i < activeInputWidget.length; i++) {
    if (normcap(activeInputWidget[i].caption) == normcap(caption)) {
      return activeInputWidget[i];
    }
  }
  return null;
}

function getButtonID (button) {
  for (i = 0; i < activeInputWidget.length; i++) {
    if (activeInputWidget[i] == button) {
      return i + 1;
    }
  }
  return -1;
}

function clearButtons (except) {
  for (i = 0; i < activeInputWidget.length; i++) {
    if (activeInputWidget[i] != except) {
      activeInputWidget[i].setStatus('default');
    }
  }
}

function choiceSelected (ev, x) {
  b = getButtonByCaption(x);
  oldstatus = b.status

  b.toggleStatus();
  if (activeQuestion["datatype"] == "select") {
    clearButtons(b);
  } else {
    b.setText((b.status == 'selected' ? '\u2612 ' : '\u2610 ') + b.caption.substring(2));
  }

  if (autoAdvance && activeQuestion["datatype"] == "select" && oldstatus == "default") {
    doAutoAdvance();
  }
}

function doAutoAdvance () {
  disableInput();
  setTimeout(function () {
      nextClicked();
      enableInput();
    }, AUTO_ADVANCE_DELAY);
}

function showError (text) {
  overlay.setText(text);
  overlay.setBgColor('#d66');
  overlay.setTimeout(3.);
  overlay.setDismiss(null);
  overlay.setActive(true);
}

function showAlert (text, ondismiss) {
  overlay.setText(text);
  overlay.setBgColor('#dd6');
  overlay.setTimeout(0.);
  overlay.setDismiss(ondismiss);
  overlay.setActive(true);
}

function showActionableAlert (text, choices, actions) {
  overlay.setText(text, choices, actions);
  overlay.setBgColor('#dd6');
  overlay.setTimeout(0.);
  overlay.setActive(true);
}

function make_button (label, args) {
  args.color = args.color || KEYBUTTON_COLOR;
  args.style = args.style || KEYBUTTON_CLASS;
  args.textcolor = args.textcolor || BUTTON_TEXT_COLOR;
  args.selcolor = args.selcolor || BUTTON_SELECTED_COLOR;
  args.caption = label;
  args.id = args.id || ('button-' + label);
  args.onclick = (args.action != null ? function (ev) { args.action(ev, label); } : null);
  return new TextButton(args);
}
  
/* utility function to generate an array of keybaord buttons for... a keyboard */
function kbs (buttons_info, template) {
  var content = [];
  for (var i = 0; i < buttons_info.length; i++) {
    var buttonspec = buttons_info[i];
    if (buttonspec != null) {
      var args = {};
      for (var key in template) {
        args[key] = template[key];
      }
      if (buttonspec instanceof Object) {
        for (var key in buttonspec) {
          args[key] = buttonspec[key];
        }
        var label = buttonspec.label;
      } else {
        var label = buttonspec;
      }
      var button = make_button(label, args);
      if (args.selected) {
        button.setStatus('selected');
      }
    } else {
      var button = null;
    }
    content.push(button); 
  }
  return content;
}

function decadeSelect () {
  var grid = render_button_grid({style: 'grid', dir: 'vert', nrows: 5, ncols: 2, width: '35@', height: '7@', spacing: '2@', textscale: 1.4, margins: '*'}, decades, false, [], decadeSelected);
  return {layout: aspect_margin('5%-', grid.layout), buttons: grid.buttons};
}

//todo: support ranges other than decade
function yearSelect (minyear, maxyear) {
  if (maxyear == null)
    maxyear = minyear + 9;

  var years = [];
  for (var o = minyear; o <= maxyear; o++) {
    years.push(o + '');
  }

  var grid = render_button_grid({style: 'grid', dir: 'vert', nrows: 5, ncols: Math.ceil((maxyear - minyear + 1) / 5), width: (maxyear - minyear) > 9 ? '22@' : '35@', height: '7@', spacing: '2@', textscale: 1.4, margins: '*'}, years, false, [], yearSelected);
  return {layout: aspect_margin('5%-', grid.layout), buttons: grid.buttons};
}

function monthSelect () {
  var grid = render_button_grid({style: 'grid', dir: 'horiz', nrows: 3, ncols: 4, width: '6@', height: '4@', spacing: '@', textscale: 1.8, margins: '*'}, monthNames, false, [], monthSelected);
  return {layout: aspect_margin('7%-', grid.layout), buttons: grid.buttons};
}

function daySelect (monthLength) {
  var days = new Array();
  for (var i = 1; i <= monthLength; i++) {
    days.push(i + '');
  }

  var grid = render_button_grid({style: 'grid', dir: 'horiz', nrows: 5, ncols: 7, width: '17@', height: '17@', spacing: '3@', textscale: 1.4, margins: '*'}, days, false, [], daySelected);
  return {layout: aspect_margin('1.7%-', grid.layout), buttons: grid.buttons};
}

function aspect_margin (margin, inner) {
  return new Layout({margins: margin, content: [inner]});
}

function render_clean () {
  render_viewport('viewport', touchscreenUI);
}

function type_ (e, c) {  
  if (c == BACKSPACE_LABEL) {
    keyCode = 0x08;
    charCode = 0;
  } else {
    if (c == '\u2012' || c == '\u2013' || c == '\u2014') {
      c = '-';
    } else if (c == '') {
      c = ' ';
    }
    
    keyCode = 0;
    charCode = c.charCodeAt(0);
  }

  if (jQuery.browser.mozilla){
      // preserve firefox behavior, just send the keypress to the input
	  var evt = document.createEvent("KeyboardEvent");
	  evt.initKeyEvent("keypress", true, true, window,
	                   0, 0, 0, 0,
	                   keyCode, charCode) 
	  elem = document.getElementsByTagName('input')[0];
	  elem.dispatchEvent(evt);
  } else {
    // only difference here is that the cursor is always assumed to be at the end of the input
    elem = $($("input")[0]);
    prev_text = elem.val();
    if (c == BACKSPACE_LABEL) {
        if (prev_text) {
            elem.val(prev_text.substring(0, prev_text.length - 1));        
        }
    } else {
        text = String.fromCharCode(charCode);
        elem.val(prev_text + text);
            
    }
  }
  
}

