
function renderrr(tree) {
  console.log(tree);

  $('#form').replaceWith(render(tree));
}

function render(elems) {
  console.log(elems);

  var tabl = $('<table border="1"><tr><td>stub</td></tr></table>');
  for (var i = 0; i < elems.length; i++) {
    var e = elems[i];
    var inner = '<tr><td>' + e.caption + '</td><td>' + e.ix + '</td></tr>';
    if (e.type == 'question') {
    } else {
      inner += '<tr><td colspan="2">' + render(e.children).html() + '</td></tr>';
    }
      tabl.find('tr:last').after(inner);
   }
  tabl.find('tr:first').remove();
  return tabl;
}