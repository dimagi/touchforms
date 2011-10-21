
function getForm(o) {
  var form = o.parent;
  while (form.parent) {
    form = form.parent;
  }
  return form;
}

function loadFromJSON(o, json) {
  $.each(json, function(key, val) {
      if (key == 'children') {
        return;
      }

      o[key] = val;
    });
}

function Form(json) {
  this.children = [];

  this.init_render = function() {
    this.$container = $('<table id="form" border="1"></table>');
    render_elements(this, json);
  }

  this.reconcile = function(new_json) {
    reconcile_elements(this, new_json);
  }

  this.child_container = function() {
    return this.$container;
  }
}

function Group(json, parent) {
  loadFromJSON(this, json);
  this.parent = parent;
  this.is_repetition = parent.is_repeat;
  this.children = [];

  this.init_render = function() {
    this.$container = $('<tr><td colspan="2"><span id="caption"></span> <a id="del" href="#">delete</a><table id="children" border="1"></table></td></tr>');
    this.$children = this.$container.find('#children');
    this.$container.find('#caption').text(this.caption + ' [' + this.ix + ']');

    render_elements(this, json.children);

    this.$del = this.$container.find('#del');
    if (!this.is_repetition) { //todo: check constraints
      this.$del.hide();
    }

    var g = this;
    this.$del.click(function() {
        console.log('delete repetition ' + g.ix);
      });
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
    this.$container = $('<tr><td colspan="2"><span id="caption"></span> <a id="add" href="#">add new</a><table id="children" border="1"></table></td></tr>');
    this.$children = this.$container.find('#children');
    this.$container.find('#caption').text(this['main-header'] + ' [' + this.ix + ']');

    render_elements(this, json.children);

    this.$add = this.$container.find('#add');
    var rep = this;
    this.$add.click(function() {
        console.log('add repetition ' + rep.ix);
      });
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
    this.$container = $('<tr><td id="caption"></td><td id="widget"></td></tr>');
    this.$widget = $('<input />');
    this.$container.find('#widget').append(this.$widget);

    var q = this;
    this.$widget.change(function() { q.onchange(); });

    this.update();
  }

  this.reconcile = function(new_json) {
    //update caption only?
    //compare everything, i guess
    //note that select choices may change due to itemsets
  }

  this.update = function() {
    this.$container.find('#caption').text(this.caption + ' [' + this.ix + ']');
  }

  this.getAnswer = function() {
    return this.$widget.val();
  }

  this.onchange = function() {
    gFormAdapter.answerQuestion(this);
  }
}

function render_elements(parent, elems) {
  for (var i = 0; i < elems.length; i++) {
    var e = elems[i];
    if (e.type == 'question') {
      var o = new Question(e, parent);
    } else if (e.type == 'sub-group') {
      var o = new Group(e, parent);
    } else if (e.type == 'repeat-juncture') {
      var o = new Repeat(e, parent);
    }
    o.init_render();
    parent.children.push(o);
    parent.child_container().append(o.$container);
  }
}

function reconcile_elements(parent, new_elems) {

}

function tmprender(elems) {
  console.log(elems);

  var f = new Form(elems);
  f.init_render();
  $('#content').append(f.$container);
}
