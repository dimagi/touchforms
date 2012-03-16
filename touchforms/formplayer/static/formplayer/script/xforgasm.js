

function WebFormSession(params) {
  this.form_uid = params.form_uid;
  this.session_data = params.session_data;
  //todo: support instance_xml ?

  this.urls = {
    xform: params.xform_url,
    autocomplete: params.autocomplete_url,
  };

  this.serverRequest = function(params, callback, blocking) {
    var sess = this;
    serverRequest(
      function (cb) {
        jQuery.post(sess.urls.xform, JSON.stringify(params), cb, "json");
      },
      callback,
      blocking
    );
  }

  this.load = function($div) {
    var sess = this;
    var adapter = new xformAjaxAdapter(this.form_uid, this.session_data, null, function(p, cb, bl) { sess.serverRequest(p, cb, bl); });
    adapter.loadForm($div);
  }
}