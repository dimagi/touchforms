function xformAjaxAdapter(formSpec, sessionData, savedInstance, ajaxfunc, submitfunc,
    resourceMap, answerCallback) {
    var self = this;
    this.formSpec = formSpec;
    this.sessionData = sessionData;
    this.session_id = null;
    this.ajaxfunc = ajaxfunc;
    this.submitfunc = submitfunc;
    this.resourceMap = resourceMap;
    this.answerCallback = answerCallback;

    $.unsubscribe([
        'formplayer.submit-form',
    ].join(' '));
    $.subscribe('formplayer.submit-form', function(e, form) {
        self.submitForm(form);
    });

    this.initForm = function(args, $div, onload, onerror) {
        var adapter = this;
        this.ajaxfunc(args, function(resp) {
            // special case short circuiting errors
            if (resp.status === "error" || resp.error) {
                if (!resp.message) {
                    resp.message = resp.error;
                }
                if (onerror) {
                    onerror(resp);
                }
                return;
            }
            if (!adapter.session_id) { // already know session id for resumed sessions
                adapter.session_id = resp["session_id"];
                console.log('session id: ' + adapter.session_id);
            }
            adapter.form = Formplayer.Utils.initialRender(resp, self.resourceMap, $div);
            if (onload) {
                onload(adapter, resp);
            }
        });
    }
}

function submit_redirect(params, path, method) {
    // hat tip: http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
    method = method || "post"; // Set method to post by default, if not specified.
    path = path || "";
    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for (var key in params) {
        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", key);
        hiddenField.setAttribute("value", params[key]);

        form.appendChild(hiddenField);
    }
    // required for FF 3+ compatibility
    document.body.appendChild(form);
    form.submit();
}


// preloaders are deprecated -- for backwards compatibility
function init_preloaders(preloaders) {
    if (preloaders == null) {
        return null;
    }

    var preload_data = {};
    for (var type in preloaders) {
        var dict = preloaders[type];

        preload_data[type] = {};
        for (var key in dict) {
            var val = dict[key];

            // this special character indicates a server preloader, which 
            // we make a synchronous request for
            if (val && val.indexOf("<") === 0) {
                valback = jQuery.ajax({
                    url: PRELOADER_URL,
                    type: 'GET',
                    data: {
                        "param": val
                    },
                    async: false
                }).responseText;
                preload_data[type][key] = valback;
            } else {
                preload_data[type][key] = val
            }
        }
    }
    return preload_data;
}
