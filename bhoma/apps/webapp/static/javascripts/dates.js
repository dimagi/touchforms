


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
      this.showScreen(decadeSelect(this.make_decades(), this), bucket != null ? bucket.start : null);
    } else if (this.screen == 'year') {
      this.showScreen(yearSelect(this.getYearBucket(), this), this.year);
    } else if (this.screen == 'month') {
      this.showScreen(monthSelect(this.year, this), this.month);
    } else if (this.screen == 'day') {
      this.showScreen(daySelect(this.month, this.year, this), this.day);
    } else if (this.screen == 'monthyear') {
      this.showScreen(monthYearSelect(this.make_months(), this), monthCount(this.year, this.month));
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

  this.goto_ = function (field) {
    this.screen = this.screensForField(field)[0];
    this.refresh();
  }

  this.selfunc = function (field) {
    var context = this;
    return function (ev, x) { context.selected(field, x); };
  }

  this.init(dir, answer, args || {});
}

function decadeSelect (decades, context) {
  var labels = [];
  var values = [];
  var ranges = [];
  for (var i = 0; i < decades.length; i++) {
    labels.push(decades[i].start + '\u2014' + decades[i].end);
    values.push(decades[i].start);
    ranges.push({start: mkNewYearsDay(decades[i].start), end: mkNewYearsEve(decades[i].end)});
  }

  var grid = render_button_grid({style: 'grid', dir: 'vert', nrows: 5, ncols: 2, width: '35@', height: '7@', spacing: '2@', textscale: 1.4, margins: '*'},
                                labels, false, [], context.selfunc('decade'));
  return {layout: aspect_margin('5%-', grid.layout), buttons: grid.buttons, values: values, dateranges: ranges};
}

function yearSelect (bucket, context) {
  var labels = [];
  var values = [];
  var ranges = [];
  for (var o = bucket.start; o <= bucket.end; o++) {
    labels.push(o + '');
    values.push(o);
    ranges.push({start: mkNewYearsDay(o), end: mkNewYearsEve(o)});
  }

  var grid = render_button_grid({style: 'grid', dir: 'vert',
                                 nrows: Math.min(bucket.end - bucket.start + 1, 5), ncols: Math.ceil((bucket.end - bucket.start + 1) / 5),
                                 width: (bucket.end - bucket.start) > 9 ? '22@' : '35@', height: '7@', spacing: '2@', textscale: 1.4, margins: '*'},
                                labels, false, [], context.selfunc('year'));
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

function monthSelect (year, context) {
  var labels = [];
  var values = [];
  var ranges = [];
  for (var i = 1; i <= 12; i++) {
    labels.push(numericMonths() ? i + '' : monthName(i));
    values.push(i);
    ranges.push(year != null ? {start: mkFirstOfMonth(year, i), end: mkLastOfMonth(year, i)} : null);
  }
  var size = (numericMonths() ? 2.2 : 1.8);

  var grid = render_button_grid({style: 'grid', dir: 'horiz', nrows: 3, ncols: 4, width: '6@', height: '4@', spacing: '@', textscale: size, margins: '*'},
                                labels, false, [], context.selfunc('month'));
  return {layout: aspect_margin('7%-', grid.layout), buttons: grid.buttons, values: values, dateranges: ranges};
}

function daySelect (month, year, context) {
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
                                labels, false, [], context.selfunc('day'));
  return {layout: aspect_margin('1.7%-', grid.layout), buttons: grid.buttons, values: values, dateranges: ranges};
}

function monthYearSelect (monthyears, context) {
  var labels = [];
  var values = [];
  var ranges = [];
  for (var i = 0; i < monthyears.length; i++) {
    var item = monthyears[i];
    labels.push((numericMonths() ? intpad(item.month) + '/' : monthName(item.month) + ' ') + item.year);
    values.push(monthCount(item.year, item.month));
    ranges.push({start: mkFirstOfMonth(item.year, item.month), end: mkLastOfMonth(item.year, item.month)});
  }

  var grid = new ChoiceSelect({choices: labels, onclick: context.selfunc('monthyear')});

  //HACK -- can't get at buttons until layout has been rendered, and ChoiceSelect MUST be wrapped in another layout, or else button references won't match up
  var layout = aspect_margin('0', grid);
  freeEntryKeyboard.update(layout);
  return {layout: layout, buttons: grid.buttons, values: values, dateranges: ranges};
}

function mkdate (y, m, d) {
  return new Date(y, m - 1, d);
}

function mkNewYearsDay (y) {
  return mkdate(y, 1, 1);
}

function mkNewYearsEve (y) {
  return mkdate(y, 12, 31);
}

function mkFirstOfMonth (y, m) {
  return mkdate(y, m, 1);
}

function mkLastOfMonth (y, m) {
  return mkdate(y, m, daysInMonth(m, y));
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

