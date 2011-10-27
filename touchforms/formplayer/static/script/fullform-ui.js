
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

function empty_check(o) {
  if (o.type == 'repeat-juncture' || o.type == 'sub-group') {
    if (o.children.length == 0) {
      o.$empty.show();
    } else {
      o.$empty.hide();
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
      }

      o[key] = val;
    });
}

function Form(json) {
  this.children = [];

  this.init_render = function() {
    this.$container = $('<div><div id="form"></div><input id="submit" type="submit" value="Submit" /></div>');
    this.$children = this.$container.find('#form');
    render_elements(this, json);

    var form = this;
    this.$container.find('#submit').click(function() {
        var areYouSure = confirm('Submit this form finally, for all time and evermore?');
        if (!areYouSure) {
          return;
        }

        gFormAdapter.submitForm(form);
      });
  }

  this.reconcile = function(new_json) {
    reconcile_elements(this, new_json);
  }

  this.child_container = function() {
    return this.$children;
  }
}

function Group(json, parent) {
  loadFromJSON(this, json);
  this.parent = parent;
  this.is_repetition = parent.is_repeat;
  this.children = [];

  this.init_render = function() {
    this.$container = $('<div class="gr"><div class="gr-header"><span id="caption"></span> <span id="ix"></span> <a id="del" href="#">delete</a></div><div id="children"></div><div id="empty">This group is empty</div></div>');
    this.$children = this.$container.find('#children');
    this.$caption = this.$container.find('#caption');
    this.$ix = this.$container.find('#ix');
    this.$empty = this.$container.find('#empty');

    render_elements(this, json.children);
    this.update();

    this.$del = this.$container.find('#del');
    if (!this.is_repetition) { //todo: check constraints
      this.$del.hide();
    }

    var g = this;
    this.$del.click(function() {
        gFormAdapter.deleteRepeat(g);
        return false;
      });
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
    this.$caption.text(this.caption);
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

  this.init_render = function() {
    this.$container = $('<div class="rep"><div class="rep-header"><span id="caption"></span> <span id="ix"></span> <a id="add" href="#">add new</a></div><div id="children"></div><div id="empty">This repeatable group is empty</div></div>');
    this.$children = this.$container.find('#children');
    this.$header = this.$container.find('#caption');
    this.$ix = this.$container.find('#ix');
    this.$empty = this.$container.find('#empty');

    render_elements(this, json.children);
    this.update();

    this.$add = this.$container.find('#add');
    var rep = this;
    this.$add.click(function() {
        gFormAdapter.newRepeat(rep);
        return false;
      });
  }

  this.reconcile = function(new_json) {
    this['main-header'] = new_json['main-header'];
    reconcile_elements(this, new_json.children);
    this.update();
  }

  this.update = function() {
    this.$header.text(this['main-header']);
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

  this.init_render = function() {
    this.$container = $('<div class="q"><div id="widget"></div><span id="req"></span><span id="caption"></span> <span id="ix"></span> <div id="error"></div><div class="eoq" /></div>');
    this.control = renderQuestion(this, this.$container.find('#widget'), this.last_answer);
    this.$error = this.$container.find('#error');

    this.update();
  }

  this.reconcile = function(new_json) {
    this.caption = new_json.caption;
    this.required = new_json.required;
    //update select choices? (change due to localization / itemsets)
    this.update();
  }

  this.update = function() {
    this.$container.find('#caption').text(this.caption);
    this.$container.find('#req').text(this.required ? '*' : '');
    this.$container.find('#ix').text('[' + ixInfo(this) + ']');
  }

  this.getAnswer = function() {
    return this.control.getAnswer();
  }

  this.prevalidate = function() {
    return this.control.prevalidate(this);
  }

  this.onchange = function() {
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
      gFormAdapter.answerQuestion(this);
    }
  }

  this.showError = function(content) {
    this.$error.text(content ? content : '');
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
  var mapping = []; // (k_old, k_new)

  var cmpkey = function (e) {
    if (e.uuid) {
      return 'uuid-' + e.uuid;
    } else {
      return 'ix-' + (e.ix ? e.ix : getIx(e));
    }
  }

  var inElementSet = function(e, set) {
    return $.map(set, function(val) { return cmpkey(val); }).indexOf(cmpkey(e));
  }

  for (var i = 0; i < parent.children.length; i++) {
    var child = parent.children[i];
    mapping.push([i, inElementSet(child, new_elems)]);
  }
  for (var i = 0; i < new_elems.length; i++) {
    if (inElementSet(new_elems[i], parent.children) == -1) {
      mapping.push([-1, i]);
    }
  }
  // sort by k_new so that deletions are processed first,
  // and inserts are processed in the right order
  mapping.sort(function(a, b) {
      return a[1] - b[1];
    });

  // since we're destructively modifying parent.children, we need to
  // keep track of which original array indexes map to the current
  // indexes. yes, really
  var ix_old = $.map(parent.children, function(val, i) { return i; });
  $.each(mapping, function(i, val) {
      var k_old = ix_old.indexOf(val[0]);
      var k_new = val[1];

      if (k_old == -1) {
        var o = make_element(new_elems[k_new], parent);
        addChild(parent, k_new, o);
      } else if (k_new == -1) {
        deleteChild(parent, k_old);
        arrayDel(ix_old, k_old);
      } else {
        parent.children[k_old].reconcile(new_elems[k_new]);
      }
    });
}

function deleteChild(parent, i) {
  var child = arrayDel(parent.children, i);
  child.$container.slideUp('slow', function() {
      child.$container.remove();
      child.destroy();
    });
  empty_check(parent);
}

function addChild(parent, i, child) {
  var domInsert = function(insert) {
    child.$container.hide();
    insert(child.$container);
    child.$container.slideDown();
  }

  if (i < parent.children.length) {
    domInsert(function(e) { parent.children[i].$container.before(e); });
  } else {
    domInsert(function(e) { parent.child_container().append(e); });
  }
  arrayInsertAt(parent.children, i, child);
  empty_check(parent);
}

function arrayDel(arr, i) {
  return arr.splice(i, 1)[0];
}

function arrayInsertAt(arr, i, o) {
  arr.splice(i, 0, o);
}

function inputActivate(enable) {
  BLOCKING_REQUEST_IN_PROGRESS = !enable;
  $('input').attr('disabled', enable ? null : 'true');
  $('a').css('color', enable ? 'blue' : 'grey');
}

function init_render(elems) {
  var f = new Form(elems);
  f.init_render();
  $('#content').append(f.$container);
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

