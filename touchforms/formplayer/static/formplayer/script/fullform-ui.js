var JST_BASE_DIR = 'formplayer/templates/formplayer/'
var markdowner = window.markdownit();

function getForm(o) {
  var form = o.parent;
  while (form.parent) {
    form = form.parent;
  }
  return form;
}

//if index is part of a repeat, return only the part beyond the deepest repeat
function relativeIndex(ix) {
  var steps = ix.split(',');
  var deepest_repeat = -1;
  for (var i = steps.length - 2; i >= 0; i--) {
    if (steps[i].indexOf(':') != -1) {
      deepest_repeat = i;
      break;
    }
  }
  if (deepest_repeat == -1) {
    return ix;
  } else {
    var rel_ix = '-';
    for (var i = deepest_repeat + 1; i < steps.length; i++) {
      rel_ix += steps[i] + (i < steps.length - 1 ? ',' : '');
    }
    return rel_ix;
  }
}

function getIx(o) {
  var ix = o.rel_ix;
  while (ix[0] == '-') {
    o = o.parent;
    if (!o) {
      break;
    }
    if (o.rel_ix.split(',').slice(-1)[0].indexOf(':') != -1) {
      ix = o.rel_ix + ',' + ix.substring(1);
    }
  }
  return ix;
}

function getForIx(o, ix) {
  if (o.type == 'question') {
    return (getIx(o) == ix ? o : null);
  } else {
    for (var i = 0; i < o.children.length; i++) {
      var result = getForIx(o.children[i], ix);
      if (result) {
        return result;
      }
    }
  }
}

function ixInfo(o) {
  var full_ix = getIx(o);
  return o.rel_ix + (o.is_repetition ? '(' + o.uuid + ')' : '') + (o.rel_ix != full_ix ? ' :: ' + full_ix : '');
}

function empty_check(o, anim_speed) {
  if (o.type === 'repeat-juncture') {
    if (anim_speed) {
      o.$empty[o.children.length ? 'slideUp' : 'slideDown'](anim_speed);
    } else {
      o.$empty[o.children.length ? 'hide' : 'show']();
    }
  } else if (o.type === 'sub-group') {
    if (anim_speed) {
      o.$container[o.children.length ? 'slideDown' : 'slideUp'](anim_speed);
    } else {
      o.$container[o.children.length ? 'show' : 'hide']();
    }
  }
}

function loadFromJSON(o, json) {
  $.each(json, function(key, val) {
      if (key == 'children') {
        return;
      } else if (key == 'ix') {
        key = 'rel_ix';
        val = relativeIndex(val);
      } else if (key == 'answer') {
        key = 'last_answer';
      } else if (key == 'style') {
        if ('domain_meta' in json) {
          key = 'domain_meta';
          val = parse_meta(json.datatype, val);
        } else {
          key = 'style';
        }
      }

      o[key] = val;
    });
}

function parse_meta(type, style) {
  var meta = {};
  
  if (type == "date") {
    meta.mindiff = style.before != null ? +style.before : null;
    meta.maxdiff = style.after != null ? +style.after : null;
  } else if (type == "int" || type == "float") {
    meta.unit = style.unit;
  } else if (type == 'str') {
    meta.autocomplete = (style.mode == 'autocomplete');
    meta.autocomplete_key = style["autocomplete-key"];
    meta.mask = style.mask;
    meta.prefix = style.prefix;
    meta.longtext = (style.raw == 'full');
  } else if (type == "multiselect") {
    if (style["as-select1"] != null) {
      meta.as_single = [];
      var vs = style["as-select1"].split(',');
      for (var i = 0; i < vs.length; i++) {
        var k = +vs[i];
        if (k != 0) {
          meta.as_single.push(k);
        }
      }
    }
  }
  
  if (type == "select" || type == "multiselect") {
    meta.appearance = style.raw;
  }

  return meta;
}

function Form(json, adapter) {
  this.adapter = adapter;
  this.children = [];
  this.template = window.JST[JST_BASE_DIR + 'fullform-ui/form.html'];

  this.init_render = function() {
    this.$container = $(this.template());
    this.$title = this.$container.find('#title');
    this.$children = this.$container.find('#form');
    this.$instancexml = $('#instance-xml')
    this.$evaluateresult = $("#evaluate-result");

    this.$title.text(json.title);
    render_elements(this, json.tree);

    var form = this;
    this.$container.find('#submit').click(function() {
        var proceed = adapter.presubmitfunc();
        if (!proceed) {
          return;
        }
        
        form.submit();
      });

    $("#evaluate-button").click(function() {

        var mxpath = document.getElementById("xpath").value;

        form.m_evaluate(mxpath);
      });

    this.submit = function() {
      this.adapter.submitForm(this);
    }

    this.m_evaluate = function(mxpath) {

      var doc = (new DOMParser()).parseFromString(minstance, 'text/xml');

      var element = document.evaluate(mxpath , doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;

      var $evaluatexml = this.evaluate_result();

      if(element == null){
          //$evaluatexml.text(vkbeautify.xml('Node does not exist.'));
      }

      //$evaluatexml.text(vkbeautify.xml(element.innerHTML || element.value))

      //$evaluatexml.elastic();

    }
  }

  this.reconcile = function(new_json) {
    reconcile_elements(this, new_json);
  }

  this.child_container = function() {
    return this.$children;
  }

  this.instance_container = function() {
      return this.$instancexml
  }

  this.submitting = function() {
    this.$container.find('#submit').val('Submitting...');
  }

  this.evaluate_result = function() {
      return this.$evaluateresult
  }
}

function Group(json, parent) {
  loadFromJSON(this, json);
  this.parent = parent;
  this.is_repetition = parent.is_repeat;
  this.children = [];
  this.template = window.JST[JST_BASE_DIR + 'fullform-ui/group.html'];

  this.init_render = function() {
    this.$container = $(this.template());
    this.$children = this.$container.find('#children');
    this.$caption = this.$container.find('#caption');
    this.$ix = this.$container.find('#ix');

    render_elements(this, json.children);
    this.update();

    this.$del = this.$container.find('#del');
    if (!this.is_repetition) { //todo: check constraints
      this.$del.hide();
    }

    var g = this;
    this.$del.click(function() {
        g.deleteRepeat();
        return false;
      });
  }

  this.deleteRepeat = function() {
    getForm(this).adapter.deleteRepeat(this);
  }

  this.reconcile = function(new_json) {
    this.caption = new_json.caption;
    if (this.is_repetition) {
      this.rel_ix = relativeIndex(new_json.ix);
    }
    reconcile_elements(this, new_json.children);    
    this.update();
  }

  this.update = function() {
    if (this.hasOwnProperty("caption_markdown") && this.caption_markdown) {
      this.$caption.html(markdowner.render(this.caption_markdown));
    } else {
      this.$caption.text(this.caption);
    }
    this.$ix.text('[' + ixInfo(this) + ']');
  }

  this.destroy = function() {

  }

  this.child_container = function() {
    return this.$children;
  }
}

function Repeat(json, parent) {
  loadFromJSON(this, json);
  this.parent = parent;
  this.children = [];
  this.is_repeat = true;
  this.template = window.JST[JST_BASE_DIR + 'fullform-ui/repeat.html'];

  this.init_render = function() {
    this.$container = $(this.template());
    this.$children = this.$container.find('#children');
    this.$header = this.$container.find('#caption');
    this.$ix = this.$container.find('#ix');
    this.$empty = this.$container.find('#empty');

    render_elements(this, json.children);
    this.update();

    this.$add = this.$container.find('#add');
    var rep = this;
    this.$add.click(function() {
        rep.newRepeat();
        return false;
      });
  }

  this.newRepeat = function() {
    getForm(this).adapter.newRepeat(this);
  }

  this.reconcile = function(new_json) {
    this['main-header'] = new_json['main-header'];
    reconcile_elements(this, new_json.children);
    this.update();
  }

  this.update = function() {
    if (this.hasOwnProperty("caption_markdown") && this.caption_markdown) {
      this.$header.html(markdowner.render(this.caption_markdown));
    } else {
      this.$header.text(this['main-header']);
    }
    this.$ix.text('[' + ixInfo(this) + ']');
  }

  this.destroy = function() {

  }

  this.child_container = function() {
    return this.$children;
  }
}

function Question(json, parent) {
  loadFromJSON(this, json);
  this.parent = parent;
  this.children = [];

  this.is_select = (this.datatype == 'select' || this.datatype == 'multiselect');
  this.template = window.JST[JST_BASE_DIR + 'fullform-ui/question.html'];

  this.init_render = function() {
    this.$container = $(this.template({ datatype: this.datatype }));
    this.$error = this.$container.find('#error');
    if (this.datatype !== 'info') {
      this.update(true);
    } else {
      this.control = new InfoEntry();
      this.control.setAnswer("OK"); // for triggers set them answered as soon as they are rendered
      this.update(false);
    }
  }

  this.reconcile = function(new_json) {
    this.caption = new_json.caption;
    this.required = new_json.required;

    var refresh_widget = false;
    if (this.is_select) {
      var different = false;
      if (this.choices.length != new_json.choices.length) {
        different = true;
      } else {
        $.each(this.choices, function(i, e) {
            if (e != new_json.choices[i]) {
              different = true;
              return false;
            }
          });
      }

      if (different) {
        this.choices = new_json.choices;
        this.last_answer = new_json.answer;
        refresh_widget = true;
      }
    }

    this.update(refresh_widget);
  }

  // this is kind of hacked up how we update select questions. generally input widgets
  // themselves aren't altered as the rest of the form changes, but select choices can
  // change due to locale switches or itemsets. ideally we should create the widget once
  // and call a reconcile() function on it, but: the select widget is currently pretty
  // complicated due to vestigial code, and the ajax api doesn't provide the select
  // values, so we can't accurately map which old choices correspond to which new
  // choices. so instead we destroy and recreate the control here, and it's messy.
  // it also screws up the focus, which we'd have to take extra steps to preserve, but
  // don't currently.

  this.update = function(refresh_widget) {
    var self = this;
    var caption = this.caption;
    var html_content = getForm(this).adapter.render_context.allow_html;

    var $capt = this.$container.find('#caption');
    $capt.empty();
    if (this.hasOwnProperty("caption_markdown") && this.caption_markdown) {
      $capt.html(markdowner.render(this.caption_markdown));
    } else if (caption) {
        if (html_content) {
          caption = caption.replace(/\n/g, '<br/>');
          $capt.html(caption);
        } else {
          $.each(caption.split('\n'), function(i, e) {
            var $ln = $('<div>');
            $ln.text(e + '\ufeff'); // add zero-width space to make empty lines show up
            $capt.append($ln);
          });
        }
    }

    this.$container.find('#req').text(this.required ? '*' : '');
    this.$container.find('#ix').text('[' + ixInfo(this) + ']');

    if (refresh_widget) {
      //var uistate = this.control.get_ui_state();

      this.$container.find('#widget').empty();
      this.control = renderQuestion(this, this.$container.find('#widget'), this.last_answer);

      //this.control.restore_ui_state(uistate);
    }

    var add_multimedia = function(attrib, control) {
      if (self.hasOwnProperty(attrib) && self[attrib]) {
        var mediaSrc = getForm(self).adapter.render_context.resourceMap(self[attrib]);
        if (mediaSrc) {
          control.attr("src", mediaSrc);
          $mediaContainer = $('<div>');
          $mediaContainer.append(control);
          var $widget = self.$container.find('#widget');
          if ($widget.length) {
            $widget.append($mediaContainer);
          } else {
            $capt.append($mediaContainer);
          }
        }
      }
    }

    if (refresh_widget || !self.$container.find('#widget').length) {
      add_multimedia('caption_image', $('<img>'));
      add_multimedia('caption_audio', $('<audio controls>Your browser does not support audio</audio>'));
      add_multimedia('caption_video', $('<video controls>Your browser does not support video</video>'));
    }
  }

  this.getAnswer = function() {
    return this.control.getAnswer();
  }

  this.prevalidate = function() {
    return this.control.prevalidate(this);
  }

  this.onchange = function() {
    if (window.mainView && !answer_eq(this.last_answer, this.getAnswer())) {
        window.mainView.router.view.dirty = true
    }
    if (this.prevalidate()) {
      //check if answer has actually changed
      if (['select', 'multiselect', 'date'].indexOf(this.datatype) != -1) {
        //free-entry datatypes are suitably handled by the 'onchange' event
        var new_answer = this.getAnswer();
        if (answer_eq(this.last_answer, new_answer)) {
          return;
        }
      }

      this.last_answer = this.getAnswer();
      this.commitAnswer();
    }
  }

  this.commitAnswer = function() {
    getForm(this).adapter.answerQuestion(this);
  }

  this.showError = function(content) {
    if (this.$error) {
        this.$error.text(content ? content : '');
    }
    this.$container[content ? 'addClass' : 'removeClass']('qerr');
  }

  this.clearError = function() {
    this.showError(null);
  }


  this.destroy = function() {
    this.control.destroy();
  }
}

function make_element(e, parent) {
  if (e.type == 'question') {
    var o = new Question(e, parent);
  } else if (e.type == 'sub-group') {
    var o = new Group(e, parent);
  } else if (e.type == 'repeat-juncture') {
    var o = new Repeat(e, parent);
  }
  o.init_render();
  return o;
}

function render_elements(parent, elems) {
  for (var i = 0; i < elems.length; i++) {
    var o = make_element(elems[i], parent);
    parent.children.push(o);
    parent.child_container().append(o.$container);
  }
  empty_check(parent);
}

function reconcile_elements(parent, new_elems) {
  var mapping = [];
  for (var i = 0; i < parent.children.length; i++) {
    var child = parent.children[i];
    mapping.push([child, inElementSet(child, new_elems)]);
  }
  for (var i = 0; i < new_elems.length; i++) {
    var new_elem = new_elems[i];
    if (inElementSet(new_elem, parent.children) == null) {
      mapping.push([null, new_elem]);
    }
  }

  $.each(mapping, function(i, val) {
      var e_old = val[0];
      var e_new = val[1];

      if (e_old == null) {
        var o = make_element(e_new, parent);
        addChild(parent, o, new_elems);
      } else if (e_new == null) {
        deleteChild(parent, e_old);
      } else {
        e_old.reconcile(e_new);
      }
    });
}

function deleteChild(parent, child) {
  child.$container.slideUp('slow', function() {
      child.$container.remove();
      child.destroy();
      arrayDelItem(parent.children, child);
      if (window.mainView) {
        window.mainView.router.view.dirty = true
      }
      empty_check(parent, 'fast');
    });
}

function addChild(parent, child, final_ordering) {
  var newIx = ixElementSet(child, final_ordering);
  var insertionIx = 0;
  for (var k = newIx - 1; k >= 0; k--) {
    var precedingIx = ixElementSet(final_ordering[k], parent.children);
    if (precedingIx != -1) {
      insertionIx = precedingIx + 1;
      break;
    }
  }

  var domInsert = function(insert) {
    child.$container.hide();
    insert(child.$container);
    child.$container.slideDown();
    if (child.control) {
        child.control.onShow();
    }
  }

  if (insertionIx < parent.children.length) {
    domInsert(function(e) { parent.children[insertionIx].$container.before(e); });
  } else {
    domInsert(function(e) { parent.child_container().append(e); });
  }
  arrayInsertAt(parent.children, insertionIx, child);
  if (window.mainView) {
    window.mainView.router.view.dirty = true
  }
  empty_check(parent, 'slow');
}

function arrayDel(arr, i) {
  return arr.splice(i, 1)[0];
}

function arrayDelItem(arr, o) {
  var ix = arr.indexOf(o);
  if (ix != -1) {
    arrayDel(arr, ix);
  }
}

function arrayInsertAt(arr, i, o) {
  arr.splice(i, 0, o);
}

var cmpkey = function (e) {
  if (e.uuid) {
    return 'uuid-' + e.uuid;
  } else {
    return 'ix-' + (e.ix ? e.ix : getIx(e));
  }
}

var ixElementSet = function(e, set) {
  //return the index of the matching element of 'e' within 'set'; -1 if no match
  return $.map(set, function(val) { return cmpkey(val); }).indexOf(cmpkey(e));
}

var inElementSet = function(e, set) {
    //return the matching object of 'e' within 'set'; null if no match
    var ix = ixElementSet(e, set);
    return (ix != -1 ? set[ix] : null);
}

function init_render(form, adapter, $div) {
  var f = new Form(form, adapter);
  f.init_render();
  $div.append(f.$container);
  return f;
}

var answer_eq = function(ans1, ans2) {
  if (ans1 === ans2) {
    return true;
  } else if (ans1 instanceof Array && ans2 instanceof Array) {
    if (ans1.length == ans2.length) {
      for (var i = 0; i < ans1.length; i++) {
        if (ans1[i] != ans2[i]) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
}

function scroll_pin(pin_threshold, $container, $elem) {
  return function() {
    var base_offset = $container.offset().top;
    var scroll_pos = $(window).scrollTop();
    var elem_pos = base_offset - scroll_pos;
    var pinned = (elem_pos < pin_threshold);

    $elem.css('top', pinned ? pin_threshold + 'px' : base_offset);
  };
}
  
function set_pin(pin_threshold, $container, $elem) {
  var pinfunc = scroll_pin(pin_threshold, $container, $elem);
  $(window).scroll(pinfunc);
  pinfunc();
}
