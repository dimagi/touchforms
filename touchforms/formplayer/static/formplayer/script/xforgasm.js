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
        this.onLoading = options.onLoading
        this.onLoadingComplete = options.onLoadingComplete

        var adapter = new xformAjaxAdapter(this.form_spec, this.session_data, this.instance_xml,
            self.serverRequest.bind(self),
            function (p) {
                self.onsubmit(p.output);
            },
            params.resourceMap,
            this.answerCallback
        );
        if (params.session_id) {
            adapter.resumeForm(params.session_id, $div, this.onload, this.onerror);
        } else {
            adapter.loadForm($div, init_lang, this.onload, this.onerror);
        }
    }

    /**
     * Sends a request to the touchforms server
     * @param {Object} requestParams - request parameters to be sent
     * @param {function} callback - function to be called on success
     * @param {boolean} blocking - whether the request should be blocking
     */
    self.serverRequest = function (requestParams, callback, blocking) {
        var url = self.urls.xform;
        if (requestParams.action === 'submit-all' && self.NUM_PENDING_REQUESTS) {
            self.taskQueue.addTask(requestParams.action, self.serverRequest, arguments, self)
        }

        requestParams.form_context = self.formContext;

        if (this.blockingRequestInProgress) {
            return;
        }
        this.blockingRequestInProgress = blocking
        $.publish('session.block', blocking);

        this.numPendingRequests++;
        this.onLoading();

        var onSuccess = function(resp) {
            if (resp.status === 'error') {
                self.onerror(resp);
            }

            // ignore responses older than the most-recently handled
            if (resp.seq_id && resp.seq_id < self.lastRequestHandled) {
                return;
            }
            self.lastRequestHandled = resp.seq_id;

            try {
                callback(resp);
            } catch (err) {
                console.error(err);
                self.onerror({message: Formplayer.Utils.touchformsError(msg)});
            }

            $.publish('session.block', false);
            this.blockingRequestInProgress = false;

            self.numPendingRequests--;
            if (self.numPendingRequests === 0) {
                self.onLoadingComplete();
                self.taskQueue.execute('submit-all');
                // Remove any submission tasks that have been queued up from spamming the submit button
                self.taskQueue.clearTasks('submit-all');
            }
        }

        $.ajax({
                type: 'POST',
                url: url,
                data: JSON.stringify(requestParams),
                dataType: "json",
            })
            .success(onSuccess)
            .fail(function (jqXHR, textStatus, errorThrown) {
                var error = Formplayer.Utils.touchformsError(jqXHR.responseJSON.message);
                self.onerror({human_readable_message: error});
                self.onLoadingComplete(true);
            });

    }

    this.blockingRequestInProgress = false;
    this.lastRequestHandled = -1;
    this.numPendingRequests = 0;

    // workaround for "forever loading" bugs...
    $(document).ajaxStop(function () {
        self.NUM_PENDING_REQUESTS = 0;
        self.blockingRequestInProgress = false;
    });
}
