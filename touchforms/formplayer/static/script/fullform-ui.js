
function renderrr(tree) {
  console.log(tree);

  $('#form').replaceWith(render(tree));
}

function Question(json) {
  this._ = json;

  this.$container = $('<tr><td id="caption"></td><td id="widget"></td></tr>');
  this.$widget = $('<input />');

  this.$container.find('#caption').text(this._.caption + ' [' + this._.ix + ']');
  this.$container.find('#widget').append(this.$widget);

  this.getAnswer = function() {
    return this.$widget.val();
  }

  this.onchange = function() {
    console.log(this._.ix + ' changed');
    gFormAdapter.answerQuestion(this);
  }
  var this2 = this;
  this.$widget.change(function() { this2.onchange(); });

  
}

function Group(json, is_repeat) {
  this._ = json;
  this.is_repeat = is_repeat;

  this.$container = $('<tr><td colspan="2"><span id="caption"></span> <a id="del" href="#">delete</a><table id="children" border="1"></table></td></tr>');
  this.$container.find('#caption').text(this._.caption + ' [' + this._.ix + ']');
  this.$del = this.$container.find('#del');
  if (!this.is_repeat) { //todo: check constraints
    this.$del.hide();
  }
  var this2 = this;
  this.$del.click(function() {
      console.log('delete repetition ' + this2._.ix);
    });

  this.render_children = function() {
    render_elements(this._.children, this.$container.find('#children'));
  }
}

function Repeat(json) {
  this._ = json;

  this.$container = $('<tr><td colspan="2"><span id="caption"></span> <a id="add" href="#">add new</a><table id="children" border="1"></table></td></tr>');
  this.$container.find('#caption').text(this._['main-header'] + ' [' + this._.ix + ']');
  this.$add = this.$container.find('#add');
  var this2 = this;
  this.$add.click(function() {
      console.log('add repetition ' + this2._.ix);
    });

  this.render_children = function() {
    render_elements(this._.children, this.$container.find('#children'), true);
  }
}

function render_elements(elems, $container, rep) {
  for (var i = 0; i < elems.length; i++) {
    var e = elems[i];
    if (e.type == 'question') {
      var o = new Question(e);
    } else if (e.type == 'sub-group') {
      var o = new Group(e, rep);
      o.render_children();
    } else if (e.type == 'repeat-juncture') {
      var o = new Repeat(e);
      o.render_children();
    }
    $container.append(o.$container);
  }
}

function render(elems) {
  console.log(elems);

  var $tabl = $('<table id="form" border="1"></table>');
  render_elements(elems, $tabl);
  return $tabl;
}

function update(elems, $form) {

}