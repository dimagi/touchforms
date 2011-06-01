

function pushHist(q, ans) {
  var d = document.createElement('div');
  d.innerHTML = '<div class="histq">&raquo; <span id="q">#</span></div><div class="histans"><span id="a" style="font-weight: bold;">#</span> &laquo;</div>';
  $('#q', d)[0].textContent = q;
  $('#a', d)[0].textContent = ans;
  $('#history')[0].appendChild(d);
}

function popHist() {
  var histlog = $('#history')[0];
  histlog.removeChild(histlog.lastChild);
}

