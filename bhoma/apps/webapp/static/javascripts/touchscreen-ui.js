

SCREEN_BORDER = 10;
SCREEN_MARGIN = 10;
SECTION_MARGIN = 6;
HEADER_HEIGHT = 60;
FOOTER_HEIGHT = 80;
FOOTER_BUTTON_WIDTH = 150;
FOOTER_BUTTON_SPACING = 6;

BORDER_COLOR = '#000';
MAIN_COLOR = '#eef';
HEADER_COLOR = '#dde';
FOOTER_COLOR = '#abd';
BUTTON_TEXT_COLOR = '#fff';
TEXT_COLOR = '#000';
KEYBUTTON_COLOR = '#118';
BUTTON_SELECTED_COLOR = '#0bf';
HIGHLIGHT_COLOR = '#ffc';
NUMPAD_COLOR = '#16c';
SPC_COLOR = '#44e';

BACKSPACE_LABEL = '\u21d0';

AUTO_ADVANCE_DELAY = 150; //ms

function initStaticWidgets () {
  questionCaption = new TextCaption('q-caption', TEXT_COLOR, '', 1., 'left', 'top');
  
  helpButton = new TextButton('help-button', '#aaa', BUTTON_TEXT_COLOR, null, null, '?', 1., helpClicked);
  backButton = new TextButton('back-button', '#6ad', BUTTON_TEXT_COLOR, null, null, 'BACK', .9, backClicked);
  homeButton = new TextButton('quit-button', '#d23', BUTTON_TEXT_COLOR, null, null, 'HOME', .9, homeClicked);
  nextButton = new TextButton('next-button', '#1a3', BUTTON_TEXT_COLOR, null, null, 'NEXT', 1.2, nextClicked);
  
  questionEntry = new Indirect();
  progressBar = new Indirect();
  
  overlay = new Overlay('#d66', HEADER_COLOR, 3., 2., '');
  touchscreenUI = new Top(
    // main content
    new Layout('main', 3, 1, '*', [HEADER_HEIGHT, '*', FOOTER_HEIGHT], SCREEN_BORDER, 0, MAIN_COLOR, BORDER_COLOR, null, [
      new Layout('header', 1, 1, '*', '*', [SCREEN_MARGIN, SCREEN_MARGIN, SCREEN_MARGIN, SECTION_MARGIN], 0, HEADER_COLOR, HEADER_COLOR, HEADER_COLOR, [
        new Layout('top-bar', 1, 2, ['*', 50], '*', 0, 5, null, null, null, [
          questionCaption,
          helpButton
        ])
      ]),
      new Layout('entry', 1, 1, '*', '*', [SCREEN_MARGIN, SCREEN_MARGIN, 0, 0], 0, null, null, null, [questionEntry]),
      new Layout('footer', 1, 4, [FOOTER_BUTTON_WIDTH, FOOTER_BUTTON_WIDTH, '*', FOOTER_BUTTON_WIDTH], '*',
                 [SCREEN_MARGIN, SCREEN_MARGIN, SECTION_MARGIN, SCREEN_MARGIN], FOOTER_BUTTON_SPACING, FOOTER_COLOR, FOOTER_COLOR, FOOTER_COLOR, [
        backButton, 
        homeButton, 
        progressBar,
        nextButton
      ]),
    ])
  ,
    //notifications overlay
    overlay
  );

  answerBar = new Indirect();
  freeEntryKeyboard = new Indirect();
  freeEntry = new Layout('free-entry', 2, 1, '*', [110, '*'], 0, 0, null, null, null, [
    answerBar,
    new Layout('kbd', 1, 1, '*', '*', [10, 10, 0, 5], 0, null, null, null, [freeEntryKeyboard])
  ]);

  numPad = new Layout('numpad', 4, 3, 105, 105, '*', 15, null, null, null,
            kbs(['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', [BACKSPACE_LABEL, '#aaa']], null, 2., type_));
  numPadDecimal = new Layout('numpad', 4, 3, 105, 105, '*', 15, null, null, null,
            kbs(['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', [BACKSPACE_LABEL, '#aaa']], null, 2., type_));
  numPadPhone = new Layout('numpad', 4, 3, 105, 105, '*', 15, null, null, null,
            kbs(['1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '0', [BACKSPACE_LABEL, '#aaa']], null, 2., type_));
  numPadBP = new Layout('numpad', 4, 3, 105, 105, '*', 15, null, null, null,
            kbs(['1', '2', '3', '4', '5', '6', '7', '8', '9', '/', '0', [BACKSPACE_LABEL, '#aaa']], null, 2., type_));
  
  if (kbdQwerty) {
    kbdFull = [
      'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', ['7', NUMPAD_COLOR], ['8', NUMPAD_COLOR], ['9', NUMPAD_COLOR],
      'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '?', ['4', NUMPAD_COLOR], ['5', NUMPAD_COLOR], ['6', NUMPAD_COLOR],
      'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '!', ['1', NUMPAD_COLOR], ['2', NUMPAD_COLOR], ['3', NUMPAD_COLOR],
      '\u2013', '+', '%', '&', '*', '/', ':', ';', '(', ')', ['', SPC_COLOR], ['0', NUMPAD_COLOR], [BACKSPACE_LABEL, '#aaa']     
    ];
    kbdAlpha = [
      'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
      'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', [BACKSPACE_LABEL, '#aaa'],
      'Z', 'X', 'C', 'V', 'B', 'N', 'M', '\u2013', '\'', ''
    ];
  } else {
    kbdFull = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', ['7', NUMPAD_COLOR], ['8', NUMPAD_COLOR], ['9', NUMPAD_COLOR], [BACKSPACE_LABEL, '#aaa'],
      'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', ['4', NUMPAD_COLOR], ['5', NUMPAD_COLOR], ['6', NUMPAD_COLOR], '.',
      'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', ['', SPC_COLOR], ['1', NUMPAD_COLOR], ['2', NUMPAD_COLOR], ['3', NUMPAD_COLOR], ',',
      '\u2013', '+', '%', '&', '*', '/', ':', ';', '(', ')', ['0', NUMPAD_COLOR], '!', '?'     
    ];
    kbdAlpha = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', [BACKSPACE_LABEL, '#aaa'],
      'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', '',
      'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '\u2013', '\''
    ];
  }

  keyboard = new Layout('text-kbd', 4, 13, 68, 85, '*', 6, null, null, null, kbs(kbdFull, null, 1.4, type_));
  keyboardAlphaOnly = new Layout('text-kbd', 3, 10, 88, 110, '*', 8, null, null, null, kbs(kbdAlpha, null, 1.9, type_));

  //progress bar is just static right now -- turn into a dedicated GUI object?
  progressBar.update(new Layout('progress-bar', 1, 2, ['30%', '*'], '*', [10, 10, 15, 15], 0, null, null, null, [
    new Layout('pb0', 1, 1, '*', '*', 0, 0, '#4d6', null, null, [null]),   
    new Layout('pb0', 1, 1, '*', '*', 0, 0, HEADER_COLOR, null, null, [null])   
  ]));

  answerText = new InputArea('textinp', 3, '#000', 5, '#fff', new TextInput('', '#000', null, '', 1.2, 'left', 0));
  freeTextAnswer = new Layout('answer-bar', 1, 2, ['7*', '*'], '*', [30, 30, 20, 20], 6, null, null, null, [
    answerText,
    new TextButton('clear-button', '#aaa', BUTTON_TEXT_COLOR, null, null, 'CLEAR', 0.8, clearClicked)
  ]);

  passwdText = new InputArea('textinp', 3, '#000', 5, '#fff', new TextInput('', '#000', null, '', 1.3, 'center', 0, true));
  passwdAnswer = new Layout('answer-bar', 1, 2, ['3*', '*'], '*', [235, 235, 20, 20], 6, null, null, null, [
    passwdText,
    new TextButton('clear-button', '#aaa', BUTTON_TEXT_COLOR, null, null, 'CLEAR', 0.8, clearClicked)
  ]);
  
  dayText = new InputArea('dayinp', 3, '#000', 0, '#fff', new TextCaption('', TEXT_COLOR, '06', 1.6, 'center', 'middle'), function () {dateEntryContext.goto_('day');});
  monthText = new InputArea('monthinp', 3, '#000', 0, '#fff', new TextCaption('', TEXT_COLOR, 'Oct', 1.6, 'center', 'middle'), function () {dateEntryContext.goto_('month');});
  yearText = new InputArea('yearinp', 3, '#000', 0, '#fff', new TextCaption('', TEXT_COLOR, '20\u2022\u2022', 1.6, 'center', 'middle'), function () {dateEntryContext.goto_('year');});  
  dateAnswer = new Layout('date-bar', 1, 6, [90, 36, 130, 36, 160, 110], '*', ['*', '*', 20, 20], 6, null, null, null, [
    dayText,
    new TextCaption('q-caption', TEXT_COLOR, '\u2013', 1.7, 'center', 'middle'),
    monthText,
    new TextCaption('q-caption', TEXT_COLOR, '\u2013', 1.7, 'center', 'middle'),
    yearText,
    new TextButton('clear-button', '#aaa', BUTTON_TEXT_COLOR, null, null, 'CLEAR', 0.8, clearClicked)
  ]);
  
  tmp = render_button_grid('grid', 5, 2, 350, 70, 20, 'vert', decades, [], decadeSelected, 1.4);
  decadeChoices = tmp[0];
  decadeButtons = tmp[1];
  tmp = render_button_grid('grid', 3, 4, 180, 120, 30, 'horiz', monthNames, [], monthSelected, 1.8);
  monthChoices = tmp[0];
  monthButtons = tmp[1];
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
    console.log('warning: workflow has no abort() method; returning to root page');
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
  stopClicks = function (ev) { ev.stopPropagation(); return false; }
  body = document.getElementById('body');

  body.addEventListener('click', stopClicks, true);
  setTimeout(function () {
      body.removeEventListener('click', stopClicks, true);
      nextClicked();
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
function kb (lab, sz, col, onclick, centered) {
  if (col == null)
    col = KEYBUTTON_COLOR;
  return new TextButton('button-' + lab, col, BUTTON_TEXT_COLOR, BUTTON_SELECTED_COLOR, null, lab, sz, (onclick != null ? function (ev) { onclick(ev, lab); } : null), centered);
}
  
/* utility function to generate an array of keybaord buttons for... a keyboard */
function kbs (infos, def_color, def_sz, onclick, centered) {
  var stuff = new Array();
  for (var i = 0; i < infos.length; i++) {
    var info = infos[i];
    if (info != null) {
      if (info instanceof Array) {
        var lab = info[0];
        var col = info.length > 1 && info[1] != null ? info[1] : def_color;
        var sz = info.length > 2 && info[2] != null ? info[2] : def_sz;
        var selected = info.length > 3 ? info[3] : false;
      } else {
        var lab = info;
        var col = def_color;
        var sz = def_sz;
        var selected = false;
      }
      var st = kb(lab, sz, col, onclick, centered);
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

  return render_button_grid('grid', 5, Math.ceil((maxyear - minyear + 1) / 5), (maxyear - minyear) > 9 ? 220 : 350, 70, 20, 'vert', years, [], yearSelected, 1.4);
}

function daySelect (monthLength) {
  var days = new Array();
  for (var i = 1; i <= monthLength; i++) {
    days.push(i + '');
  }
  return render_button_grid('grid', 5, 7, 85, 85, 15, 'horiz', days, [], daySelected, 1.4);
}

function getTextExtent (text, size, bounding_width) {
  if (bounding_width == null) {
    bounding_width = 1500;
  }

  snippet = document.getElementById('snippet');
  snippet.style.width = bounding_width + 'px';
  snippet.textContent = text;
  snippet.style.fontSize = 100. * size + '%';
  return [snippet.offsetWidth, snippet.offsetHeight];
}

function buttonDimensions (textdim) {
  return [Math.round(1.1 * textdim[0] + 0.7 * textdim[1]), Math.round(textdim[1] * 1.5)];
}

function choiceSelect (choices, selected, multi, W_MAX, H_MAX) {
  if (multi) {
    for (i = 0; i < choices.length; i++) {
      choices[i] = '\u2610 ' + choices[i];
    }
  }

  //1) analysis of choices to determine optimum layout

  //available size of choice area (ideally we should determine this dynamically; too tough for now)
  W_MAX = W_MAX || 922;
  H_MAX = H_MAX || 571;

  var MAX_TEXT_SIZE_GRID = 2.5;
  var MAX_TEXT_SIZE_LIST = 1.8;
  var MIN_TEXT_SIZE = .3;
  var MAX_LENGTH_FOR_GRID = 350.;
  var MAX_LENGTH_DIFF_FOR_GRID_ABS = 125;
  var MAX_LENGTH_DIFF_FOR_GRID_REL = 2.2;
  var DIFF_REF_THRESHOLD = 50.;
  var GOLDEN_RATIO = 1.6;
  
  if (choices.length <= 6) {
    var SPACING_RATIO = .15;
  } else if (choices.length <= 12) {
    var SPACING_RATIO = .1;
  } else {
    var SPACING_RATIO = .05;
  }
    
  //determine whether to use grid-based layout (centered, buttons oriented in grid pattern)
  //or list-based layout (left-justified, vertical orientation)
  var lengths = [];
  var min_w = -1;
  var max_w = -1;
  var h = -1;
  var longest_choice = null;
  for (i = 0; i < choices.length; i++) {
    var ext = getTextExtent(choices[i], 1.);
    var w = ext[0];
    h = ext[1];
    lengths.push(w);
    if (min_w == -1 || w < min_w)
      min_w = w;
    if (max_w == -1 || w > max_w) {
      max_w = w;
      longest_choice = choices[i];
    }
  }
  if (max_w > MAX_LENGTH_FOR_GRID || max_w - min_w > MAX_LENGTH_DIFF_FOR_GRID_ABS || (min_w >= DIFF_REF_THRESHOLD && max_w/min_w > MAX_LENGTH_DIFF_FOR_GRID_REL)) {
    style = 'list';
  } else {
    style = 'grid';
  }

  if (style == 'grid') {
    //determine best grid dimensions -- layout that best approaches GOLDEN_RATIO
    buttondim = buttonDimensions([max_w, h]);
    best_arrangement = null;
    zvalue = -1;
    for (var r = 1; r <= choices.length; r++) {
      c = Math.ceil(choices.length / r);
      spc = buttondim[1] * .33;
      spc = (spc > 40 ? 40 : (spc < 15 ? 15 : spc));
      ratio = (buttondim[0] * c + spc * (c - 1)) / (buttondim[1] * r + spc * (r - 1));
      z = (ratio < GOLDEN_RATIO ? GOLDEN_RATIO / ratio : ratio / GOLDEN_RATIO);
      if (r * c == choices.length) { //bonus for grid being completely filled
        z -= .75
      }
      if (zvalue == -1 || z < zvalue) {
        zvalue = z;
        best_arrangement = [r, c];
      }
    }
    rows = best_arrangement[0];
    cols = best_arrangement[1];    
    var dir = (rows > cols ? 'vert' : 'horiz'); //determine orientation

    //determine best button sizing -- largest sizing that will fit within allowed area
    for (size = MAX_TEXT_SIZE_GRID; size >= MIN_TEXT_SIZE; size -= .1) {
      var ext = buttonDimensions(getTextExtent(longest_choice, size));
      bw = ext[0];
      bh = ext[1];
      best_spc = -1;
      zvalue = -1;
      //determine best inter-button spacing for given size -- where ratio of button area to inter-button area best approaches SPACING_RATIO
      for (spc = 5; spc <= 50; spc += 5) {
        w_total = (cols * bw + (cols - 1) * spc);
        h_total = (rows * bh + (rows - 1) * spc);
        k0 = bw * bh * rows * cols;
        k1 = w_total * h_total;
        ratio = (k1 - k0) / (k0 + k1);
        z = (ratio < SPACING_RATIO ? SPACING_RATIO / ratio : ratio / SPACING_RATIO);
        if (zvalue == -1 || z < zvalue) {
          zvalue = z;
          best_spc = spc;
        }
      }
      w_total = (cols * bw + (cols - 1) * best_spc);
      h_total = (rows * bh + (rows - 1) * best_spc);
      if (w_total <= W_MAX && h_total <= H_MAX) {
        break;
      }
    }
    width = bw;
    height = bh;
    text_scale = size;
    spacing = best_spc;
  } else if (style == 'list') {
    dir = 'vert';

    //layout priority: maximize button size
    fits = false;
    for (size = MAX_TEXT_SIZE_LIST; size >= MIN_TEXT_SIZE; size -= .1) {
      var ext = buttonDimensions(getTextExtent(longest_choice, size));
      bw = ext[0];
      bh = ext[1];
      spc = Math.max(Math.round(bh * .1), 5);

      rows = Math.floor((H_MAX + spc) / (bh + spc));
      cols = Math.ceil(choices.length / rows)
      w_total = (cols * bw + (cols - 1) * spc);
      h_total = (rows * bh + (rows - 1) * spc);
      if (w_total <= W_MAX && h_total <= H_MAX) {
        fits = true;
        break;
      }
    }
    if (!fits) {
      throw Error("choices too numerous or verbose to fit!");
    }

    width = bw;
    height = bh;
    text_scale = size;
    spacing = spc;
  }
    
  //2) render choices according to layout parameters
  return render_button_grid(style, rows, cols, width, height, spacing, dir, choices, selected, choiceSelected, text_scale, multi);
}

function render_button_grid (style, rows, cols, width, height, spacing, dir, choices, selected, func, text_scale, multi) {
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

  layout_info = new Layout('ch', rows, cols, width, height, margins, spacing, null, null, null, button_grid);
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

  var evt = document.createEvent("KeyboardEvent");
  evt.initKeyEvent("keypress", true, true, window,
                   0, 0, 0, 0,
                   keyCode, charCode) 
  elem = document.getElementsByTagName('input')[0];
  elem.dispatchEvent(evt);
}

