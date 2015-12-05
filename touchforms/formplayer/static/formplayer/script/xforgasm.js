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

function TaskQueue() {
    this.queue = [];
};

/*
 * Executes the queue in a FIFO action. If name is supplied, will execute the first
 * task for that name.
 */
TaskQueue.prototype.execute = function(name) {
    var task,
        idx;
    if (name) {
        idx = _.indexOf(_.pluck(this.queue, 'name'), name);
        if (idx === -1) { return; }
        task = this.queue.splice(idx, 1)[0];
    } else {
        task = this.queue.shift();
    }
    if (!task) { return; }
    task.fn.apply(task.thisArg, task.parameters);
};

TaskQueue.prototype.addTask = function (name, fn, parameters, thisArg) {
    var task = { name: name, fn: fn, parameters: parameters, thisArg: thisArg };
    this.queue.push(task);
    return task;
};

TaskQueue.prototype.clearTasks = function(name) {
    var idx;
    if (name) {
        idx = _.indexOf(_.pluck(this.queue, 'name'), name);
        while (idx !== -1) {
            this.queue.splice(idx, 1);
            idx = _.indexOf(_.pluck(this.queue, 'name'), name);
        }
    } else {
        this.queue = []
    }
}

function WebFormSession(params) {

    var self = this;
    self.taskQueue = new TaskQueue();
    self.heartbeat_has_failed = false;
    self.formContext = params.formContext;
    if (params.form_uid) {
        self.form_spec = {type: 'uid', val: params.form_uid};
    } else if (params.form_content) {
        self.form_spec = {type: 'raw', val: params.form_content};
    } else if (params.form_url) {
        self.form_spec = {type: 'url', val: params.form_url};
    }

    self.instance_xml = params.instance_xml;
    self.session_data = params.session_data || {};
    self.answerCallback = params.answerCallback;
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
            },
            this.answerCallback
        );
        if (params.session_id) {
            adapter.resumeForm(params.session_id, $div, this.onload, this.onerror);
        } else {
            adapter.loadForm($div, init_lang, this.onload, this.onerror);
        }
    }

    self.submit = function (params) {
        this.onsubmit(params.output);
    }

    self.serverRequest = function (requestParams, callback, blocking) {
        var that = this;
        var url = that.urls.xform;
        if (requestParams.action === 'submit-all' && self.NUM_PENDING_REQUESTS) {
            self.taskQueue.addTask(requestParams.action, self.serverRequest, arguments, self)
        }

        var _errMsg = function (msg) {
            return "".concat(ERROR_MESSAGE, msg);
        };
        requestParams.form_context = self.formContext;

        this._serverRequest(
            function (cb) {
                jQuery.ajax(
                    {type: "POST",
                        url: url,
                        data: JSON.stringify(requestParams),
                        success: cb,
                        dataType: "json",
                        error: function (jqXHR, textStatus, errorThrown) {
                            var error = _errMsg(errorThrown);
                            if (textStatus === 'timeout') {
                                error = "CommCareHQ has detected a possible network connectivity problem. " +
                                    "Please make sure you are connected to the " +
                                    "Internet in order to submit your form."
                            } else {
                                try {
                                    var json_resp = JSON.parse(jqXHR.responseText);
                                    if (json_resp.hasOwnProperty('message')) {
                                        error = json_resp.message;
                                    }
                                } catch (e) {
                                    // do nothing
                                }
                            }

                            var skip_error_msg = false;
                            if (requestParams.action == "heartbeat") {
                                if (that.heartbeat_has_failed) {
                                    // If the xformAjaxAdapter heartbeat can't find the server,
                                    // we only want to log that error one time.
                                    skip_error_msg = true;
                                } else {
                                    that.heartbeat_has_failed = true;
                                }
                            }
                            if (!skip_error_msg) {
                                that.onerror({human_readable_message: error});
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

    this.blockingRequestInProgress = false;
    this.lastRequestHandled = -1;
    this.numPendingRequests = 0;

    // makeRequest - function that takes in a callback function and executes an
    //     asynchronous request (GET, POST, etc.) with the given callback
    // callback - callback function for request
    // blocking - if true, no further simultaneous requests are allowed until
    //     this request completes
    this._serverRequest = function (makeRequest, callback, blocking) {
        if (this.blockingRequestInProgress) {
            return;
        }
        this.blockingRequestInProgress = blocking
        $.publish('session.block', blocking);

        this.numPendingRequests++;
        this.onLoading();

        var sess = this;
        makeRequest(function (resp) {
            // ignore responses older than the most-recently handled
            if (resp.seq_id && resp.seq_id < sess.lastRequestHandled) {
                return;
            }
            sess.lastRequestHandled = resp.seq_id;

            try {
                callback(resp);
            } catch (err) {
                console.error(err);
                var msg = "".concat(ERROR_MESSAGE, err.message);
                sess.onerror({message: msg});
            }

            $.publish('session.block', false);
            this.blockingRequestInProgress = false;

            sess.numPendingRequests--;
            if (sess.numPendingRequests === 0) {
                sess.onLoadingComplete();
                sess.taskQueue.execute('submit-all');
                // Remove any submission tasks that have been queued up from spamming the submit button
                sess.taskQueue.clearTasks('submit-all');
            }
        });
    }

    // workaround for "forever loading" bugs...
    $(document).ajaxStop(function () {
        self.NUM_PENDING_REQUESTS = 0;
        self.blockingRequestInProgress = false;
    });
}
