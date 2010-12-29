

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
BUTTON_DISABLED_COLOR = '#888';
HIGHLIGHT_COLOR = '#ffc';
NUMPAD_COLOR = '#16c';
NUMPAD_CLASS = 'numpad-button';
SPC_COLOR = '#44e';
SPC_CLASS = 'spacebar';

HELP_BGCOLOR = '#6d6';
ERR_BGCOLOR = '#d66';
ALERT_BGCOLOR = '#dd6';

BACKSPACE_CLASS = 'clear-button';


BACKSPACE_LABEL = '\u21d0';

AUTO_ADVANCE_DELAY = 150; //ms

function initStaticWidgets () {
  questionCaption = new TextCaption({id: 'q-caption', color: TEXT_COLOR, align: 'left', valign: 'top'});
  
  helpButton = new TextButton({id: 'help-button', color: '#aaa', textcolor: BUTTON_TEXT_COLOR, caption: '?', textsize: 1., onclick: helpClicked});
  backButton = new TextButton({id: 'back-button', color: '#6ad', textcolor: BUTTON_TEXT_COLOR, caption: 'BACK', textsize: .9, onclick: backClicked});
  homeButton = new TextButton({id: 'home-button', color: '#d23', textcolor: BUTTON_TEXT_COLOR, caption: 'HOME', textsize: .9, onclick: homeClicked});
  nextButton = new TextButton({id: 'next-button', color: '#1a3', textcolor: BUTTON_TEXT_COLOR, caption: 'NEXT', textsize: 1.2, onclick: nextClicked});
  
  questionEntry = new Indirect();
  
  overlay = new Overlay(HEADER_COLOR, 2.);
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
  
  if (qwertyKbd()) {
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

  answerText = new InputArea({id: 'textinp', border: 3, padding: 5, child: new TextInput({textsize: 1.2, align: 'left', spacing: 0})});  
  freeTextAnswer = make_answerbar(answerText, '*', 'answer-bar');

  passwdText = new InputArea({id: 'textinp', border: 3, padding: 5, child: new TextInput({textsize: 1.3, spacing: 0, passwd: true})});
  passwdAnswer = make_answerbar(passwdText, '5@', 'passwd-bar');
  
  dayText = new InputArea({id: 'dayinp', border: 3, child: new TextCaption({color: TEXT_COLOR, size: 1.6}), onclick: function () {dateEntryContext.goto_('day');}});
  monthText = new InputArea({id: 'monthinp', border: 3, child: new TextCaption({color: TEXT_COLOR, size: 1.6}), onclick: function () {dateEntryContext.goto_('month');}});
  yearText = new InputArea({id: 'yearinp', border: 3, child: new TextCaption({color: TEXT_COLOR, size: 1.6}), onclick: function () {dateEntryContext.goto_('year');}});  
  var make_date_answerbar = function () {
    var dateSpacer = function () { return new TextCaption({color: TEXT_COLOR, caption: '\u2013', size: 1.7}); };

    var content = [];
    var widths = [];
    for (var i = 0; i < 3; i++) {
      var field = dateDisplayOrder()[i];
      if (field == 'd') {
        content.push(dayText);
        widths.push('1.3@');
      } else if (field == 'm') {
        content.push(monthText);
        widths.push(numericMonths() ? '1.3@' : '1.85@');
      } else if (field == 'y') {
        content.push(yearText);
        widths.push('2.3@');
      }

      if (i < 2) {
        content.push(dateSpacer());
        widths.push('.5@');
      }
    }

    return make_answerbar(content, widths, 'date-bar');
  }
  dateAnswer = make_date_answerbar();
}

function setting (varname, defval) {
  var val = window[varname];
  return (val != null ? val : defval);
}

function numericMonths () {
  return setting('NUMERIC_MONTHS', false);
}

function qwertyKbd () {
  return setting('KBD_QWERTY', false);
}

function autoAdvance () {
  return setting('AUTO_ADVANCE', true);
}

function dateDisplayOrder () {
  return setting('DATE_DISPLAY_ORDER', 'dmy');
}

//not acted upon yet
function dateEntryOrder () {
  var val = setting('DATE_ENTRY_ORDER', 'ymd');
  return (val == '-' ? dateDisplayOrder() : val);
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
  overlay.activate({
      text: activeQuestion["help"] || "There is no help text for this question.",
      color: HELP_BGCOLOR,
      timeout: 15.
    });
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

function DateWidgetContext (dir, answer, args) {
  this.DEFAULT_FUTURE_RANGE = 1826; //days ~= 5 years
  this.MAX_MONTHS_FOR_YEARLESS = 8;
  this.YEAR_COLUMN = 5;
  this.NUM_DECADE_CHOICES = 10;
  this.DECADE_ROLLOVER = 4;

  this.init = function (dir, answer, args) {
    this.setDate(answer);
    this.setAllowedRange(args);
    if (!answer) {
      this.prefill();
    }
    this.initScreens(dir, answer);

    //remove when we have dict-based choices
    this.choiceHack = null;
  }

  this.setDate = function (datestr) {
    if (datestr == null) {
      this.year = null;
      this.month = null;
      this.day = null;
    } else {
      var parsed = parseDate(datestr);
      this.year = parsed.year;
      this.month = parsed.month;
      this.day = parsed.day;
    }
    this.year_bucket = null;
    this.changed = false;
  }

  this.setAllowedRange = function (args) {
    var setlimit = function (datelimit, limitdelta, limitdefault, assignfunc) {
      if (datelimit) {
        var datefields = parseDate(datelimit);
      } else {
        limitdelta = (limitdelta == null ? limitdefault : limitdelta);
        datelimit = new Date(new Date().getTime() + limitdelta * 86400000);
        var datefields = {
          year: datelimit.getFullYear(),
          month: datelimit.getMonth() + 1,
          day: datelimit.getDate()
        };
      }

      datefields.date = mkdate(datefields.year, datefields.month, datefields.day);
      assignfunc(datefields);
    }

    var self = this;
    setlimit(args.mindate, args.mindiff != null ? -args.mindiff : null, -50000, function (df) {
        self.minyear = df.year;
        self.minmonth = df.month;
        self.minday = df.day;
        self.mindate = df.date;
      });
    setlimit(args.maxdate, args.maxdiff, this.DEFAULT_FUTURE_RANGE, function (df) {
        self.maxyear = df.year;
        self.maxmonth = df.month;
        self.maxday = df.day;
        self.maxdate = df.date;
      });
    this.outofrangemsg = (args.outofrangemsg != null ? args.outofrangemsg + ' The allowed range is: {{range}}.' : 'This date is outside the allowed range ({{range}}).');

    if (this.mindate > this.maxdate) {
      throw new Error('bad allowed date range');
    }
  }

  this.prefill = function () {
    if (this.minyear == this.maxyear) {
      this.year = this.minyear;
      if (this.minmonth == this.maxmonth) {
        this.month = this.minmonth;
        if (this.minday == this.maxday) {
          this.day = this.minday;
        }
      }
    }
  }

  this.initScreens = function (dir, answer) {
    this.screens = ['day'];
    if (monthCount(this.maxyear, this.maxmonth) - monthCount(this.minyear, this.minmonth) + 1 <= this.MAX_MONTHS_FOR_YEARLESS) {
      this.screens.push('monthyear');
    } else {
      this.screens.push('month');
      this.screens.push('year');
      if (Math.floor(this.maxyear / this.YEAR_COLUMN) - Math.floor(this.minyear / this.YEAR_COLUMN) > 2) {
        this.screens.push('decade');
      }
    }

    this.screen = (dir || answer == null ? this.getFirstScreen() : this.getLastScreen());
  }

  this.make_decades = function () {
    if (this.screens.indexOf('decade') == -1) {
      return [{start: this.minyear, end: this.maxyear}];
    } else {
      var decades = [];
      
      var start = Math.floor((this.maxyear - this.DECADE_ROLLOVER) / 10) * 10;
      decades.push({start: start, end: this.maxyear});
      while (decades.length < this.NUM_DECADE_CHOICES) {
        start -= 10;
        decades.push({start: start, end: start + 9});
      }
      
      return decades;
    }
  }

  this.make_months = function () {
    var year = this.minyear;
    var month = this.minmonth;
    var months = [];

    while (monthCount(year, month) <= monthCount(this.maxyear, this.maxmonth)) {
      months.push({year: year, month: month});
      month += 1;
      if (month > 12) {
        year += 1;
        month = 1;
      }
    }

    return months;
  }

  this.getYearBucket = function () {
    var buckets = this.make_decades();
    if (buckets.length == 1) {
      return buckets[0];
    } else if (this.year != null) {
      for (var i = 0; i < buckets.length; i++) {
        if (buckets[i].start <= this.year && buckets[i].end >= this.year) {
          return buckets[i];
        }
      }
    } else if (this.year_bucket != null) {
      return this.year_bucket;
    } else {
      return null;
    }
  }

  this.isFull = function () {
    return (this.year != null && this.month != null && this.day != null);
  }

  this.isEmpty = function () {
    return (this.year_bucket == null && this.year == null && this.month == null && this.day == null);
  }

  this.isValid = function () {
    return (this.isFull() && this.day <= daysInMonth(this.month, this.year));
  }

  this.isInRange = function () {
    if (this.isValid()) {
      return rangeOverlap(this.mindate, this.maxdate, mkdate(this.year, this.month, this.day));
    } else {
      return false;
    }
  }

  this.getDate = function () {
    if (this.isFull()) {
      return this.year + '-' + intpad(this.month, 2) + '-' + intpad(this.day, 2);
    } else {
      return null;
    }
  }

  this.refresh = function () {
    questionEntry.update(freeEntry);
    answerBar.update(dateAnswer);

    var year_bucket = this.getYearBucket();
    if (this.year != null) {
      yearText.setText(this.year + '');
    } else if (year_bucket != null) {
      sstart = year_bucket.start + '';
      send = year_bucket.end + '';
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
    monthText.setText(this.month != null ? (numericMonths() ? intpad(this.month, 2) : monthName(this.month)) : '');
    dayText.setText(this.day != null ? intpad(this.day, 2) : '');

    if (this.screen == 'decade') {
      var bucket = this.getYearBucket();
      this.showScreen(decadeSelect(this.make_decades()), bucket != null ? bucket.start : null);
    } else if (this.screen == 'year') {
      this.showScreen(yearSelect(this.getYearBucket()), this.year);
    } else if (this.screen == 'month') {
      this.showScreen(monthSelect(this.year), this.month);
    } else if (this.screen == 'day') {
      this.showScreen(daySelect(this.month, this.year), this.day);
    } else if (this.screen == 'monthyear') {
      this.showScreen(monthYearSelect(this.make_months()), monthCount(this.year, this.month));
    }
    freeEntryKeyboard.update(selectWidget);
  }

  this.showScreen = function (choice_info, selected_val) {
    selectWidget = choice_info.layout;
    activeInputWidget = choice_info.buttons;

    this.choiceHack = [];
    for (var i = 0; i < choice_info.buttons.length; i++) {
      this.choiceHack.push({label: choice_info.buttons[i].caption, value: choice_info.values[i]});
    }

    this.select(selected_val);

    for (var i = 0; i < choice_info.buttons.length; i++) {
      if (choice_info.dateranges[i] != null && !rangeOverlap(this.mindate, this.maxdate, choice_info.dateranges[i].start, choice_info.dateranges[i].end)) {
        choice_info.buttons[i].setStatus('disabled');
      }
    }

    this.highlight();
  }

  this.select = function (val) {
    clearButtons();

    if (val != null) {
      var caption = null;
      for (var i = 0; i < this.choiceHack.length; i++) {
        if (this.choiceHack[i].value == val) {
          caption = this.choiceHack[i].label;
          break;
        }
      }

      var b = (caption != null ? getButtonByCaption(caption) : null);
      if (b != null) {
        b.setStatus('selected');
      }
    }
  }

  this.highlight = function () {
    var self = this;
    var highlightField = function (domobj, field) {
      domobj.setBgColor(self.screensForField(field).indexOf(self.screen) != -1 ? HIGHLIGHT_COLOR : '#fff');
    }
    highlightField(yearText, 'year');
    highlightField(monthText, 'month');
    highlightField(dayText, 'day');
  }

  this.clear = function () {
    if (this.getDate() != null)
      this.changed = true;

    this.year = null;
    this.month = null;
    this.day = null;
    this.year_bucket = null;
    this.prefill();

    this.screen = this.getFirstScreen();
    this.refresh();
  }

  this.next = function () {
    if (this.isEmpty() || this.isFull()) {
      if (this.isEmpty() || this.isValid()) {
        if (!this.isEmpty() && !this.isInRange()) {
          showError(this.outofrangemsg.replace('{{range}}', readableDate(this.minyear, this.minmonth, this.minday) + ' \u2014 ' + readableDate(this.maxyear, this.maxmonth, this.maxday)));
        } else {
          answerQuestion();
        }
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
        showError('Please pick a ' + (this.screen == 'decade' ? 'year' : (this.screen == 'monthyear' ? 'month' : this.screen)) + '. To skip this question and leave it blank, click \'CLEAR\' first.');
        return;
      } else {
        this.screen = this.getEmptyScreen();
      }
      this.refresh();
    }
  }
  
  this.getEmptyScreen = function () {
    var screens = this.screenOrder();
    for (var i = 0; i < screens.length; i++) {
      var empty = false;
      if (screens[i] == 'decade' && this.getYearBucket() == null) {
        empty = true;
      } else if (screens[i] == 'year' && this.year == null) {
        empty = true;
      } else if (screens[i] == 'month' && this.month == null) {
        empty = true;
      } else if (screens[i] == 'day' && this.day == null) {
        empty = true;
      } else if (screens[i] == 'monthyear' && monthCount(this.year, this.month) == null) {
        empty = true;
      }
      if (empty) {
        return screens[i];
      }
    }
    return null;
  }

  this.getNextScreen = function () {
    var screens = this.screenOrder();
    i = screens.indexOf(this.screen) + 1;
    return (i >= screens.length ? null : screens[i]);
  }

  this.getPrevScreen = function () {
    var screens = this.screenOrder();
    i = screens.indexOf(this.screen) - 1;
    return (i < 0 ? null : screens[i]);
  }

  this.getFirstScreen = function () {
    var scr = this.getEmptyScreen();
    return (scr != null ? scr : this.screenOrder()[0]);
  }

  this.getLastScreen = function () {
    return ainv(this.screenOrder(), -1);
  }

  this.getFieldOrder = function () {
    var order = [];
    var s = dateEntryOrder();
    for (var i = 0; i < 3; i++) {
      order.push(({d: 'day', m: 'month', y: 'year'})[s[i]]);
    }
    return order;
  }

  this.screensForField = function (field) {
    var candidates = [];
    if (field == 'year') {
      candidates = ['decade', 'year', 'monthyear'];
    } else if (field == 'month') {
      candidates = ['month', 'monthyear'];
    } else if (field == 'day') {
      candidates = ['day'];
    }

    var screens = []
    for (var i = 0; i < candidates.length; i++) {
      if (this.screens.indexOf(candidates[i]) != -1) {
        screens.push(candidates[i]);
      }
    }
    return screens;
  }

  this.screenOrder = function () {
    var order = [];
    var fields = this.getFieldOrder();
    for (var i = 0; i < fields.length; i++) {
      var fieldscreens = this.screensForField(fields[i]);
      for (var j = 0; j < fieldscreens.length; j++) {
        if (order.indexOf(fieldscreens[j]) == -1) {
          order.push(fieldscreens[j]);
        }
      }
    }
    return order;
  }

  this.selected = function (field, caption) {
    var val = null;
    for (var i = 0; i < this.choiceHack.length; i++) {
      if (this.choiceHack[i].label == caption) {
        val = this.choiceHack[i].value;
        break;
      }
    }

    if (field == 'decade') {
      var oldbucket = this.getYearBucket();

      this.year_bucket == null;
      var buckets = this.make_decades();
      for (var i = 0; i < buckets.length; i++) {
        if (buckets[i].start == val) {
          this.year_bucket = buckets[i];
          break;
        }
      }

      if (oldbucket == null || oldbucket.start != this.year_bucket.start) {
        this.changed = true;
        this.year = null;
      }
    } else if (field == 'year') {
      oldyear = this.year;
      this.year = val;
      if (oldyear != this.year) {
        this.changed = true;
        this.year_bucket == null;
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
    } else if (field == 'monthyear') {
      if (monthCount(this.year, this.month) != val) {
        this.year = Math.floor(val / 12);
        this.month = (val % 12) + 1;
        this.changed = true;
      }
    }
    this.select(val);
    
    var complete = false;
    var nextscreen = this.getNextScreen();
    if (nextscreen == null) {
      if (!this.isFull()) {
        this.screen = this.getEmptyScreen();
      } else {
        //stay on current screen; must click 'next' to advance question
        complete = true;
      }
    } else {
      this.screen = nextscreen;
    }
    
    this.refresh();

    if (complete && autoAdvance()) {
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
    this.screen = this.screensForField(field)[0];
    this.refresh();
  }

  this.init(dir, answer, args || {});
}

function dateselfunc (field) {
  return function (ev, x) { dateEntryContext.selected(field, x); };
}

function decadeSelect (decades) {
  var labels = [];
  var values = [];
  var ranges = [];
  for (var i = 0; i < decades.length; i++) {
    labels.push(decades[i].start + '\u2014' + decades[i].end);
    values.push(decades[i].start);
    ranges.push({start: mkdate(decades[i].start, 1, 1), end: mkdate(decades[i].end, 12, 31)});
  }

  var grid = render_button_grid({style: 'grid', dir: 'vert', nrows: 5, ncols: 2, width: '35@', height: '7@', spacing: '2@', textscale: 1.4, margins: '*'},
                                labels, false, [], dateselfunc('decade'));
  return {layout: aspect_margin('5%-', grid.layout), buttons: grid.buttons, values: values, dateranges: ranges};
}

function yearSelect (bucket) {
  var labels = [];
  var values = [];
  var ranges = [];
  for (var o = bucket.start; o <= bucket.end; o++) {
    labels.push(o + '');
    values.push(o);
    ranges.push({start: mkdate(o, 1, 1), end: mkdate(o, 12, 31)});
  }

  var grid = render_button_grid({style: 'grid', dir: 'vert',
                                 nrows: Math.min(bucket.end - bucket.start + 1, 5), ncols: Math.ceil((bucket.end - bucket.start + 1) / 5),
                                 width: (bucket.end - bucket.start) > 9 ? '22@' : '35@', height: '7@', spacing: '2@', textscale: 1.4, margins: '*'},
                                labels, false, [], dateselfunc('year'));
  var layout = grid.layout;
  if (values.length <= 5) {
    //this is really, really, ugly
    var full_w = 35 * 2 + 2;
    var full_h = 7 * 5 + 2 * 4;
    var w = 35;
    var h = 7 * values.length + 2 * (values.length - 1);
    layout = new Layout({margins: '*', widths: full_w + '@', heights: full_h + '@', content: [new Layout({margins: '*', widths: (100.*w/full_w) + '%', heights: (100.*h/full_h) + '%', content: [layout]})]});
  }
  return {layout: aspect_margin('5%-', layout), buttons: grid.buttons, values: values, dateranges: ranges};
}

function monthSelect (year) {
  var labels = [];
  var values = [];
  var ranges = [];
  for (var i = 1; i <= 12; i++) {
    labels.push(numericMonths() ? i + '' : monthName(i));
    values.push(i);
    ranges.push(year != null ? {start: mkdate(year, i, 1), end: mkdate(year, i, daysInMonth(i, year))} : null);
  }
  var size = (numericMonths() ? 2.2 : 1.8);

  var grid = render_button_grid({style: 'grid', dir: 'horiz', nrows: 3, ncols: 4, width: '6@', height: '4@', spacing: '@', textscale: size, margins: '*'},
                                labels, false, [], dateselfunc('month'));
  return {layout: aspect_margin('7%-', grid.layout), buttons: grid.buttons, values: values, dateranges: ranges};
}

function daySelect (month, year) {
  var monthLength = daysInMonth(month, year);
  var labels = [];
  var values = [];
  var ranges = [];
  for (var i = 1; i <= monthLength; i++) {
    labels.push(i + '');
    values.push(i);
    ranges.push(monthCount(year, month) != null ? {start: mkdate(year, month, i), end: mkdate(year, month, i)} : null);
  }

  var grid = render_button_grid({style: 'grid', dir: 'horiz', nrows: 5, ncols: 7, width: '17@', height: '17@', spacing: '3@', textscale: 1.4, margins: '*'},
                                labels, false, [], dateselfunc('day'));
  return {layout: aspect_margin('1.7%-', grid.layout), buttons: grid.buttons, values: values, dateranges: ranges};
}

function monthYearSelect (monthyears) {
  var labels = [];
  var values = [];
  var ranges = [];
  for (var i = 0; i < monthyears.length; i++) {
    var item = monthyears[i];
    labels.push((numericMonths() ? intpad(item.month) + '/' : monthName(item.month) + ' ') + item.year);
    values.push(monthCount(item.year, item.month));
    ranges.push({start: mkdate(item.year, item.month, 1), end: mkdate(item.year, item.month, daysInMonth(item.month, item.year))});
  }

  var grid = new ChoiceSelect({choices: labels, onclick: dateselfunc('monthyear')});

  //HACK -- can't get at buttons until layout has been rendered, and ChoiceSelect MUST be wrapped in another layout, or else button references won't match up
  var layout = aspect_margin('0', grid);
  freeEntryKeyboard.update(layout);
  return {layout: layout, buttons: grid.buttons, values: values, dateranges: ranges};
}

function mkdate (y, m, d) {
  return new Date(y, m - 1, d);
}

function intpad (x, n) {
  var s = x + '';
  while (s.length < n) {
    s = '0' + s;
  }
  return s;
}

function monthName (mnum) {
  if (mnum == null)
    return null;

  if (mnum >= 1 && mnum <= 12) {
    return monthNames[mnum - 1];
  } else {
    throw new Error(mnum + ' not a valid month');
  }
}
       
function monthForName (mname) {
  if (mname == null)
    return null;

  var mnum = monthNames.indexOf(mname);
  if (mnum != -1) {
    return mnum + 1;
  } else {
    throw new Error(mname + ' not a valid month');
  }
}

function isLeap (year) {
  return (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));
}

function daysInMonth (month, year) {
  if (month == null)
    return 31;
  if (year == null && month == 2)
    return 28;

  if (month == 2) {
    return 28 + (isLeap(year) ? 1 : 0);
  } else if (month == 4 || month == 6 || month == 9 || month == 11) {
    return 30;
  } else {
    return 31;
  }
}

function monthCount (year, month) {
  return (year == null || month == null ? null : 12 * year + month - 1);
}

function rangeOverlap (start0, end0, start1, end1) {
  end1 = end1 || start1;
  return Math.max(start0, start1) <= Math.min(end0, end1);
}

function parseDate (datestr) {
  var year = +datestr.substring(0, 4);
  var month = +datestr.substring(5, 7);
  var day = +datestr.substring(8, 10);
  return {year: year, month: month, day: day};
}

function readableDate (y, m, d) {
  return (y >= 1900 && y <= 2050 ? monthName(m) + ' ' + d + ', ' + y : 'anything');
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
      if (activeInputWidget[i].status != 'disabled') {
        activeInputWidget[i].setStatus('default');
      }
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

  if (autoAdvance() && activeQuestion["datatype"] == "select" && oldstatus == "default") {
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
  overlay.activate({
      text: text,
      color: ERR_BGCOLOR,
      timeout: 3.,
    });
}

function showAlert (text, ondismiss) {
  overlay.activate({
      text: text,
      color: ALERT_BGCOLOR,
      ondismiss: ondismiss
    });
}

function showActionableAlert (text, choices, actions) {
  overlay.activate({
      text: text,
      choices: choices,
      actions: actions,
      color: ALERT_BGCOLOR
    });
}

function make_button (label, args) {
  args.color = args.color || KEYBUTTON_COLOR;
  args.style = args.style || KEYBUTTON_CLASS;
  args.textcolor = args.textcolor || BUTTON_TEXT_COLOR;
  args.selcolor = args.selcolor || BUTTON_SELECTED_COLOR;
  args.inactcolor = args.inactcolor || BUTTON_DISABLED_COLOR;
  args.caption = label;
  args.id = args.id || ('button-' + label);

  var clickfunc = function (ev) {
    //this is a hack
    if (activeInputWidget instanceof Array) {
      var button = null;
      for (var i = 0; i < activeInputWidget.length; i++) {
        if (activeInputWidget[i].caption == label) {
          button = activeInputWidget[i];
          break;
        }
      }
      if (button) {
        if (button.status == 'disabled')
          return;
      }
    }

    args.action(ev, label);
  }

  args.onclick = (args.action != null ? clickfunc : null);
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

