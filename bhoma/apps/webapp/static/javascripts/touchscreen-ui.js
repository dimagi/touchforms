

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

BACKSPACE_LABEL = '\u21d0';

function initStaticWidgets () {
  questionCaption = new TextCaption('q-caption', TEXT_COLOR, '', 1., 'left', 'top');
  
  helpButton = new TextButton('help-button', '#aaa', BUTTON_TEXT_COLOR, null, null, '?', 1., helpClicked);
  backButton = new TextButton('back-button', '#6ad', BUTTON_TEXT_COLOR, null, null, 'BACK', .9, backClicked);
  menuButton = new TextButton('quit-button', '#d23', BUTTON_TEXT_COLOR, null, null, 'MENU', .9, menuClicked);
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
        menuButton, 
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
  
  keyboard = new Layout('text-kbd', 4, 13, 68, 85, '*', 6, null, null, null, kbs([
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', '7', '8', '9', [BACKSPACE_LABEL, '#aaa'],
    'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', '4', '5', '6', '',
    'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '.',
    '\u2013', '+', '%', '&', '*', '/', ':', ';', '(', ')', '!', '?', ','     
  ], null, 1.4, type_));

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
  
  dayText = new InputArea('dayinp', 3, '#000', 0, '#fff', new TextCaption('', TEXT_COLOR, '06', 1.6, 'center', 'middle'));
  monthText = new InputArea('monthinp', 3, '#000', 0, '#fff', new TextCaption('', TEXT_COLOR, 'Oct', 1.6, 'center', 'middle'));
  yearText = new InputArea('yearinp', 3, '#000', 0, '#fff', new TextCaption('', TEXT_COLOR, '2\u2022\u2022\u2022', 1.6, 'center', 'middle'));  
  dateAnswer = new Layout('date-bar', 1, 6, [90, 36, 130, 36, 160, 110], '*', ['*', '*', 20, 20], 6, null, null, null, [
    dayText,
    new TextCaption('q-caption', TEXT_COLOR, '\u2013', 1.7, 'center', 'middle'),
    monthText,
    new TextCaption('q-caption', TEXT_COLOR, '\u2013', 1.7, 'center', 'middle'),
    yearText,
    new TextButton('clear-button', '#aaa', BUTTON_TEXT_COLOR, null, null, 'CLEAR', 0.8, clearClicked)
  ]);
  
  decadeChoices = new Layout('cdc', 5, 2, 350, 70, '*', 20, null, null, null, 
    kbs(['2000\u20142010', '1950\u20141959', '1990\u20141999', '1940\u20141949', '1980\u20141989',
         '1930\u20141939', '1970\u20141979', '1920\u20141929', '1960\u20141969', '1910\u20141919'], null, 1.4, decadeSelected));
  monthChoices = new Layout('cm', 3, 4, 180, 120, '*', 30, null, null, null, 
    kbs(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], null, 1.8, monthSelected));
}

function helpClicked (ev, x) {
  overlay.setText('Here is some help text.');
  overlay.setBgColor('#6d6');
  overlay.setTimeout(15.);
  overlay.setActive(true);
}

function backClicked (ev, x) {
  prevQuestion();
}

function menuClicked (ev, x) {
  alert('show menu');
}

function nextClicked (ev, x) {
  answerQuestion();
}

function clearClicked (ev, x) {
  type = activeQuestion["datatype"];
  if (type == "str" || type == "int" || type == "float") {
    activeInputWidget.setText('');
  } else {
 
  }
}

function DateWidgetContext (direction, answer) {
  this.screen = null;
  this.decade = null;
  this.year = null;
  this.month = null;
  this.day = null;








/*
    <button onClick="questionEntry.update(freeEntry); answerBar.update(dateAnswer); freeEntryKeyboard.update(decadeChoices);">date: year 1/2</button>
    <button onClick="questionEntry.update(freeEntry); answerBar.update(dateAnswer); freeEntryKeyboard.update(yearSelect(1990));">date: year 2/2</button>
    <button onClick="questionEntry.update(freeEntry); answerBar.update(dateAnswer); freeEntryKeyboard.update(monthChoices);">date: month</button>
    <button onClick="questionEntry.update(freeEntry); answerBar.update(dateAnswer); freeEntryKeyboard.update(daySelect(29));">date: day</button>
*/
    



}

function decadeSelected (ev, x) {
  alert('decade ' + x);
}

function yearSelected (ev, x) {
  alert('year ' + x);
}

function monthSelected (ev, x) {
  alert('month ' + x);
}

function daySelected (ev, x) {
  alert('day ' + x);
}

function getButtonByCaption (caption) {
  for (i = 0; i < activeInputWidget.length; i++) {
    if (activeInputWidget[i].caption == caption) {
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

function choiceSelected (ev, x) {
  b = getButtonByCaption(x);
  b.setStatus(b.status == 'default' ? 'selected' : 'default');
  if (activeQuestion["datatype"] == "select") {
    for (i = 0; i < activeInputWidget.length; i++) {
      if (activeInputWidget[i] != b) {
	activeInputWidget[i].setStatus('default');
      }
    }
  }
}

function showError (text) {
  overlay.setText(text);
  overlay.setBgColor('#d66');
  overlay.setTimeout(3.);
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

function vertArrange (list, rows) {
  var grid = [];
  var cols = Math.ceil(list.length / rows);
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      grid.push(list[rows * c + r]);
    }
  }
  return grid;
}

//todo: support ranges other than decade
function yearSelect (minyear, maxyear) {
  if (maxyear == null)
    maxyear = minyear + 9;

  var years = [];
  for (var o = minyear; o <= maxyear; o++) {
    years.push(o);
  }
  years = vertArrange(years, 5);
  return new Layout('cy', 5, Math.ceil((maxyear - minyear + 1) / 5), (maxyear - minyear) > 9 ? 220 : 350, 70, '*', 20, null, null, null, kbs(years, null, 1.4, yearSelected));
}

function daySelect (monthLength) {
  var r = 5;
  var c = 7;
  var days = new Array();
  for (var i = 1; i <= r * c; i++) {
    days.push(i <= monthLength ? i : null);
  }
  return new Layout('cd', r, c, 85, 85, '*', 15, null, null, null, kbs(days, null, 1.4, daySelected));
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

function choiceSelect (choices, selected) {
  //1) analysis of choices to determine optimum layout

  //available size of choice area (ideally we should determine this dynamically; too tough for now)
  W_MAX = 922;
  H_MAX = 571;

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
      if (w_total <= W_MAX) {
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
        var cell = choices[i];
        if (selected != null && selected.indexOf(i + 1) != -1) {
          cell = [cell, null, null, true];
	}
      }
      cells.push(cell);
    }
  }

  button_grid = kbs(cells, null, text_scale, choiceSelected, style == 'grid');
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

