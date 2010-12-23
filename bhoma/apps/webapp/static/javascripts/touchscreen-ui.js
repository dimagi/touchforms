

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
KEYBUTTON_CLASS = 'shiny-button';
BUTTON_SELECTED_COLOR = '#0bf';
HIGHLIGHT_COLOR = '#ffc';
NUMPAD_COLOR = '#16c';
SPC_COLOR = '#44e';

KEYBUTTON_CLASS = 'key-button';
BACKSPACE_CLASS = 'clear-button';
NUMPAD_CLASS = 'numpad-button';
SPC_CLASS= 'spacebar';


BACKSPACE_LABEL = '\u21d0';

AUTO_ADVANCE_DELAY = 150; //ms

function initStaticWidgets () {
  questionCaption = new TextCaption('q-caption', TEXT_COLOR, '', 1., 'left', 'top');
  
  helpButton = new TextButton('help-button', '#aaa', BUTTON_TEXT_COLOR, null, null, '?', 1., helpClicked);
  backButton = new TextButton('back-button', '#6ad', BUTTON_TEXT_COLOR, null, null, 'BACK', .9, backClicked);
  homeButton = new TextButton('home-button', '#d23', BUTTON_TEXT_COLOR, null, null, 'HOME', .9, homeClicked);
  nextButton = new TextButton('next-button', '#1a3', BUTTON_TEXT_COLOR, null, null, 'NEXT', 1.2, nextClicked);
  
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
  freeEntry = new Layout({id: 'free-entry', nrows: 2, heights: [110, '*'], content: [
    answerBar,
    new Layout({id: 'kbd', margins: [10, 10, 0, 5], content: [freeEntryKeyboard]})
  ]});

  makeNumpad = function (extraKey) {
    return new Layout({margins: '1.7%-', content: [
        new Layout({id: 'numpad', nrows: 4, ncols: 3, widths: '7@', heights: '7@', margins: '*', spacings: '@', 
                    content: kbs(['1', '2', '3', '4', '5', '6', '7', '8', '9', extraKey, '0', [BACKSPACE_LABEL, BACKSPACE_CLASS]], null, 2., type_)})
      ]});
  }

  numPad = makeNumpad();
  numPadDecimal = makeNumpad('.');
  numPadPhone = makeNumpad('+');
  numPadBP = makeNumpad('/');
  
  if (kbdQwerty) {
    kbdFull = [
      'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', ['7', NUMPAD_CLASS], ['8', NUMPAD_CLASS], ['9', NUMPAD_CLASS],
      'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '?', ['4', NUMPAD_CLASS], ['5', NUMPAD_CLASS], ['6', NUMPAD_CLASS],
      'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '!', ['1', NUMPAD_CLASS], ['2', NUMPAD_CLASS], ['3', NUMPAD_CLASS],
      '\u2013', '+', '%', '&', '*', '/', ':', ';', '(', ')', ['', SPC_CLASS], ['0', NUMPAD_CLASS], [BACKSPACE_LABEL, BACKSPACE_CLASS]     
    ];
    kbdAlpha = [
      'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
      'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', [BACKSPACE_LABEL, BACKSPACE_CLASS],
      'Z', 'X', 'C', 'V', 'B', 'N', 'M', '\u2013', '\'', ''
    ];
  } else {
    kbdFull = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', ['7', NUMPAD_CLASS], ['8', NUMPAD_CLASS], ['9', NUMPAD_CLASS], [BACKSPACE_LABEL, BACKSPACE_CLASS],
      'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', ['4', NUMPAD_CLASS], ['5', NUMPAD_CLASS], ['6', NUMPAD_CLASS], '.',
      'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', ['', SPC_CLASS], ['1', NUMPAD_CLASS], ['2', NUMPAD_CLASS], ['3', NUMPAD_CLASS], ',',
      '\u2013', '+', '%', '&', '*', '/', ':', ';', '(', ')', ['0', NUMPAD_CLASS], '!', '?'     
    ];
    kbdAlpha = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', [BACKSPACE_LABEL, BACKSPACE_CLASS],
      'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', '',
      'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '\u2013', '\''
    ];
  }

  keyboard = new Layout({id: 'text-kbd', nrows: 4, ncols: 13, widths: '4@', heights: '5@', margins: '*', spacings: '0.36@', content: kbs(kbdFull, null, 1.4, type_)});
  keyboardAlphaOnly = new Layout({id: 'text-kbd', nrows: 3, ncols: 10, widths: '4@', heights: '5@', margins: '*', spacings: '0.36@', content: kbs(kbdAlpha, null, 1.9, type_)});
  
  answerText = new InputArea('textinp', 3, '#000', 5, '#fff', new TextInput('', '#000', null, '', 1.2, 'left', 0));
  freeTextAnswer = new Layout({id: 'answer-bar', ncols: 2, widths: ['7*', '*'], margins: [30, 20], spacings: 6, content: [
    answerText,
    new TextButton('clear-button', '#aaa', BUTTON_TEXT_COLOR, null, null, 'CLEAR', 0.8, clearClicked)
  ]});

  passwdText = new InputArea('textinp', 3, '#000', 5, '#fff', new TextInput('', '#000', null, '', 1.3, 'center', 0, true));
  passwdAnswer = new Layout({id: 'answer-bar', ncols: 2, widths: ['3*', '*'], margins: [235, 20], spacings: 6, content: [
    passwdText,
    new TextButton('clear-button', '#aaa', BUTTON_TEXT_COLOR, null, null, 'CLEAR', 0.8, clearClicked)
  ]});
  
  dayText = new InputArea('dayinp', 3, '#000', 0, '#fff', new TextCaption('', TEXT_COLOR, '06', 1.6, 'center', 'middle'), function () {dateEntryContext.goto_('day');});
  monthText = new InputArea('monthinp', 3, '#000', 0, '#fff', new TextCaption('', TEXT_COLOR, 'Oct', 1.6, 'center', 'middle'), function () {dateEntryContext.goto_('month');});
  yearText = new InputArea('yearinp', 3, '#000', 0, '#fff', new TextCaption('', TEXT_COLOR, '20\u2022\u2022', 1.6, 'center', 'middle'), function () {dateEntryContext.goto_('year');});  
  dateAnswer = new Layout({id: 'date-bar', ncols: 6, widths: [90, 36, 130, 36, 160, 110], margins: ['*', 20], spacings: 6, content: [
    dayText,
    new TextCaption('q-caption', TEXT_COLOR, '\u2013', 1.7, 'center', 'middle'),
    monthText,
    new TextCaption('q-caption', TEXT_COLOR, '\u2013', 1.7, 'center', 'middle'),
    yearText,
    new TextButton('clear-button', '#aaa', BUTTON_TEXT_COLOR, null, null, 'CLEAR', 0.8, clearClicked)
  ]});
  
  tmp = renderbuttongrid_obsolete('grid', 5, 2, 350, 70, 20, 'vert', decades, [], decadeSelected, 1.4);
  decadeChoices = tmp[0];
  decadeButtons = tmp[1];
  tmp = renderbuttongrid_obsolete('grid', 3, 4, 180, 120, 30, 'horiz', monthNames, [], monthSelected, 1.8);
  monthChoices = tmp[0];
  monthButtons = tmp[1];
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
      selectWidget = decadeChoices;
      activeInputWidget = decadeButtons;
      this.select(this.decade, this.decade != null ? this.decade[0] + '\u2014' + this.decade[1] : null);
      this.highlight();
    } else if (this.screen == 'year') {
      tmp = yearSelect(this.decade[0], this.decade[1]);
      selectWidget = tmp[0];
      activeInputWidget = tmp[1];
      this.select(this.year);
      this.highlight();
    } else if (this.screen == 'month') {
      selectWidget = monthChoices;
      activeInputWidget = monthButtons;
      this.select(this.month);
      this.highlight();
    } else if (this.screen == 'day') {
      tmp = daySelect(daysInMonth(this.month, this.year));
      selectWidget = tmp[0];
      activeInputWidget = tmp[1];
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

/* utility function to generate a single keyboard button */
function kb (lab, sz, col, onclick, centered, cls) {
  if (col == null)
    col = KEYBUTTON_COLOR;
  if (cls == null) 
    cls = KEYBUTTON_CLASS;
  return new TextButton('button-' + lab, col, BUTTON_TEXT_COLOR, BUTTON_SELECTED_COLOR, null, lab, sz, (onclick != null ? function (ev) { onclick(ev, lab); } : null), centered, cls);
}
  
/* utility function to generate an array of keybaord buttons for... a keyboard */
function kbs (infos, def_cls, def_sz, onclick, centered) {
  var stuff = new Array();
  for (var i = 0; i < infos.length; i++) {
    var info = infos[i];
    if (info != null) {
      if (info instanceof Array) {
        var lab = info[0];
        var cls = info.length > 1 && info[1] != null ? info[1] : def_cls;
        var sz = info.length > 2 && info[2] != null ? info[2] : def_sz;
        var selected = info.length > 3 ? info[3] : false;
      } else {
        var lab = info;
        var cls = def_cls;
        var sz = def_sz;
        var selected = false;
      }
      var st = kb(lab, sz, null, onclick, centered, cls);
      if (selected) {
        st.setStatus('selected');
      }
    } else {
      var st = null;
    }
    stuff.push(st);
  }
  return stuff;
}

//todo: support ranges other than decade
function yearSelect (minyear, maxyear) {
  if (maxyear == null)
    maxyear = minyear + 9;

  var years = [];
  for (var o = minyear; o <= maxyear; o++) {
    years.push(o + '');
  }

  return renderbuttongrid_obsolete('grid', 5, Math.ceil((maxyear - minyear + 1) / 5), (maxyear - minyear) > 9 ? 220 : 350, 70, 20, 'vert', years, [], yearSelected, 1.4);
}

function daySelect (monthLength) {
  var days = new Array();
  for (var i = 1; i <= monthLength; i++) {
    days.push(i + '');
  }
  return renderbuttongrid_obsolete('grid', 5, 7, 85, 85, 15, 'horiz', days, [], daySelected, 1.4);
}



//OBSOLETE!!
function renderbuttongrid_obsolete (style, rows, cols, width, height, spacing, dir, choices, selected, func, text_scale, multi) {
  if (style == 'list') {
    var margins = [30, '*', 30, '*'];
  } else if (style == 'grid') {
    var margins = '*';
  }
  
  var cells = [];
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      var i = (dir == 'horiz' ? cols * r + c : rows * c + r);
      if (i >= choices.length) {
        var cell = null;
      } else {
        if (selected != null && selected.indexOf(i + 1) != -1) {
          var cell = [(multi ? '\u2612' + choices[i].substring(1) : choices[i]), null, null, true];
        } else {
          var cell = choices[i];
        }
      }
      cells.push(cell);
    }
  }

  button_grid = kbs(cells, null, text_scale, func, style == 'grid');
  buttons = []
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      var i = (dir == 'horiz' ? cols * r + c : rows * c + r);
      if (i < choices.length) {
        buttons[i] = button_grid[cols * r + c];
      }
    }
  }  

  layout_info = new Layout({id: 'ch', nrows: rows, ncols: cols, widths: width, heights: height, margins: margins, spacings: spacing, content: button_grid});
  return [layout_info, buttons];
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

