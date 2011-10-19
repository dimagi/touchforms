
function renderrr(tree) {
  console.log(tree);

  $('#form').replaceWith(render(tree));
}

function Question(json) {
  this._ = json;

  this.$row = $('<tr><td id="caption"></td><td id="widget"></td></tr>');
  this.$widget = $('<input />');

  this.$row.find('#caption').text(this._.caption);
  this.$row.find('#widget').append(this.$widget);

  this.onchange = function() {
    console.log(this._.ix + ' changed');
    var ans = this.$widget.val();
    console.log('answer is ' + ans);
    gFormAdapter.answerQuestion(this._.ix, ans);
  }
  var this2 = this;
  this.$widget.change(function() { this2.onchange(); });

  
}

function render(elems) {
  console.log(elems);

  var tabl = $('<table id="form" border="1"><tr><td>stub</td></tr></table>');
  for (var i = 0; i < elems.length; i++) {
    var e = elems[i];
    //var inner = '<tr><td>' + e.caption + '</td><td>' + e.ix + '</td></tr>';
    if (e.type == 'question') {
      var q = new Question(e);
      tabl.find('tr:last').after(q.$row);
    } else {
      //  inner += '<tr><td colspan="2">' + render(e.children).html() + '</td></tr>';
    }
    //      tabl.find('tr:last').after(inner);
   }
  tabl.find('tr:first').remove();
  return tabl;
}

function update(elems, $form) {

}