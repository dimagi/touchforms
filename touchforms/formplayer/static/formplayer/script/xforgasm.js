// IE compliance
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (e) {
        var ix = -1;
        for (var i = 0; i < this.length; i++) {
            if (this[i] === e) {
                ix = i;
                break;
            }
        }
        return ix;
    }
}

var ERROR_MESSAGE = "Something unexpected went wrong on that request. " +
    "If you have problems filling in the rest of your form please submit an issue. " +
    "Technical Details: ";

function WebFormSession(params) {
    var self = this;
    self.heartbeat_has_failed = false;
    self.offline_mode = isOffline(params.xform_url);
    if (params.form_uid) {
        if (self.offline_mode) {
            throw "load form by UID is not possible for offline mode";
        }
        self.form_spec = {type: 'uid', val: params.form_uid};
    } else if (params.form_content) {
        self.form_spec = {type: 'raw', val: params.form_content};
    } else if (params.form_url) {
        self.form_spec = {type: 'url', val: params.form_url};
    }

    //note: the 'allow_html' param will open you up to XSS attacks if you have
    //forms that insert user-entered data into captions!

    self.instance_xml = params.instance_xml;
    self.session_data = params.session_data || {};
    if (!self.session_data.host) {
        self.session_data.host = window.location.protocol + '//' + window.location.host;
    }

    self.onsubmit = params.onsubmit;
    self.onpresubmit = params.onpresubmit || function () {
        return true;
    };

    // onload/onlanginfo
    self._onload = params.onload || function (adapter, response) {
    };
    if (params.onlanginfo) {
        self.onload = function (adapter, response) {
            self._onload(adapter, response);
            if (response['langs'].length) {
                params.onlanginfo(function (lang) {
                    adapter.switchLanguage(lang);
                }, response['langs']);
            }
        }
    } else {
        self.onload = self._onload;
    }

    self.onerror = params.onerror || function (resp) {
    };

    self.urls = {
        xform: params.xform_url,
        autocomplete: params.autocomplete_url
    };

    self.load = function ($div, init_lang, options) {
        /*
         options currently allows for two parameters:
         onLoading: a function to call when there are pending requests to the server
         onLoadingComplete: a function to call when requests are completed. can take an optional
         parameter which will be true if an error occurred.
         */
        this.$div = $div;
        this.$div.addClass('webforms');

        options = options || {};
        this.onLoading = options.onLoading || function () {
            $('#loading').show();
        };
        this.onLoadingComplete = options.onLoadingComplete || function () {
            $('#loading').hide();
        };

        var sess = this;
        var adapter = new xformAjaxAdapter(this.form_spec, this.session_data, this.instance_xml,
            function (p, cb, bl) {
                sess.serverRequest(p, cb, bl);
            },
            function (p) {
                sess.submit(p);
            },
            this.onpresubmit,
            {
                allow_html: params.allow_html,
                resourceMap: params.resourceMap
            }
        );
        if (params.session_id) {
            adapter.resumeForm(params.session_id, $div, this.onload, this.onerror);
        } else {
            adapter.loadForm($div, init_lang, this.onload, this.onerror);
        }
    }

    self.submit = function (params) {
        this.inputActivate(false);
        this.inputActivate = function () {
        }; //hack to keep input fields disabled during final POST

        this.onsubmit(params.output);
    }

    self.serverRequest = function (params, callback, blocking) {
        var that = this;
        var url = that.urls.xform;

        if (this.offline_mode) {
            // give local touchforms daemon credentials to talk to HQ independently
            params.hq_auth = {type: 'django-session', key: $.cookie('sessionid')};
        }
        var _errMsg = function (msg) {
            return "".concat(ERROR_MESSAGE, msg);
        };

        this._serverRequest(
            function (cb) {
                jQuery.ajax(
                    {type: "POST",
                        url: url,
                        data: JSON.stringify(params),
                        success: cb,
                        dataType: "json",
                        error: function (jqXHR, textStatus, errorThrown) {
                            var skip_error_msg = false;
                            if (params.action == "heartbeat"){
                                if (that.heartbeat_has_failed){
                                    // If the xformAjaxAdapter heartbeat can't find the server,
                                    // we only want to log that error one time.
                                    skip_error_msg = true;
                                } else {
                                    that.heartbeat_has_failed = true;
                                }
                            }
                            if (!skip_error_msg) {
                                that.onerror({message: _errMsg(errorThrown)});
                            }
                            that.onLoadingComplete(true);
                        }
                    });

            },
            function (response) {
                // wrap the callback so we can catch generic errors and handle them
                if (response.status === "error") {
                    that.onerror(response);
                } else {
                    callback(response);
                }
            },
            blocking
        );
    }

    this.BLOCKING_REQUEST_IN_PROGRESS = false;
    this.LAST_REQUEST_HANDLED = -1;
    this.NUM_PENDING_REQUESTS = 0;

    // makeRequest - function that takes in a callback function and executes an
    //     asynchronous request (GET, POST, etc.) with the given callback
    // callback - callback function for request
    // blocking - if true, no further simultaneous requests are allowed until
    //     this request completes
    this._serverRequest = function (makeRequest, callback, blocking) {
        if (this.BLOCKING_REQUEST_IN_PROGRESS) {
            return;
        }


        this.NUM_PENDING_REQUESTS++;
        this.onLoading();
        $("input#submit").attr('disabled', 'disabled');

        if (blocking) {
            this.inputActivate(false); // sets BLOCKING_REQUEST_IN_PROGRESS
        }
        var sess = this;
        makeRequest(function (resp) {
            // ignore responses older than the most-recently handled
            if (resp.seq_id && resp.seq_id < sess.LAST_REQUEST_HANDLED) {
                return;
            }
            sess.LAST_REQUEST_HANDLED = resp.seq_id;

            try {
                callback(resp);
            } catch (err) {
                var msg = "".concat(ERROR_MESSAGE, err.message);
                sess.onerror({message: msg});
            }
            if (blocking) {
                sess.inputActivate(true); // clears BLOCKING_REQUEST_IN_PROGRESS
            }

            sess.NUM_PENDING_REQUESTS--;
            if (sess.NUM_PENDING_REQUESTS == 0) {
                sess.onLoadingComplete();
                $("input#submit").removeAttr('disabled');
            }
        });
    }

    self.inputActivate = function (enable) {
        this.BLOCKING_REQUEST_IN_PROGRESS = !enable;
        this.$div.find('input').attr('disabled', enable ? null : 'true');
        this.$div.find('a').css('color', enable ? 'blue' : 'grey');
    }

    // workaround for "forever loading" bugs...
    $(document).ajaxStop(function () {
        self.NUM_PENDING_REQUESTS = 0;
        self.BLOCKING_REQUEST_IN_PROGRESS = false;
    });

}

function submit_form_post(xml) {
    submit_redirect({type: 'form-complete', output: xml});
}

function touchformsHeartbeat(url, online, offline) {
    $.get(url).done(function () {
        online();
    }).fail(function (resp) {
        if (resp.status == 0) {
            offline();
        } else {
            // even error responses show that the daemon is still alive
            online();
        }
    });
}

function runInterval(func, interval) {
    var timer = setInterval(function () {
        func(function () {
            clearInterval(timer);
        });
    }, 1000. * interval);
    // also run now without delay
    func(function () {
        clearInterval(timer);
    });
}

function isOffline(touchforms_url) {
    var tf = $('<a>').attr('href', touchforms_url)[0];
    return (window.location.host != tf.host);
}

// loadfunc: function that initializes the touchforms session (creates an adapter, loads a form, ...)
// promptfunc(show): function that controls UI that notifies user that offline cloudcare isn't running
//     and prompts them to install it. show == true: show this UI; false: hide it
function touchformsInit(url, loadfunc, promptfunc) {
    if (!isOffline(url)) {
        // don't bother with heartbeat
        loadfunc();
        return;
    }

    runInterval(function (cancel) {
        touchformsHeartbeat(url, function () {
            cancel();
            promptfunc(false);
            loadfunc();
        }, function () {
            promptfunc(true);
        });
    }, 1.);
}
