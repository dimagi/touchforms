

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
BACKSPACE_CLASS = 'clear-button';

HELP_BGCOLOR = '#6d6';
ERR_BGCOLOR = '#d66';
ALERT_BGCOLOR = '#dd6';

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
  return setting('DATE_DISPLAY_ORDER', 'ymd');
}

function dateEntryOrder () {
  var val = setting('DATE_ENTRY_ORDER', '-');
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

  //shortcuts
  var shortcut_args = {'type': 'keydown', 'propagate': false, 'target': document};
  shortcut.add("Alt+N", function() { answerQuestion(); }, shortcut_args);
  shortcut.add("Alt+P", function() { prevQuestion(); }, shortcut_args);
  shortcut.add("esc", function() { overlay.setActive(false); }, shortcut_args);
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

function getButtonByCaption (caption) {
  for (i = 0; i < activeInputWidget.length; i++) {
    if (activeInputWidget[i].label == caption) {
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
      activeInputWidget[i].resetStatus();
    }
  }
}

function choiceSelected (ev, x) {
  b = getButtonByCaption(x);
  oldstatus = b.status

  b.toggleStatus();
  if (activeQuestion["datatype"] == "select") {
    clearButtons(b);
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
  args.label = label;

  return new ChoiceButton(args);
}
  
/* utility function to generate a grid array of buttons */
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

