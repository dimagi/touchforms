var Formplayer = {
    Utils: {},
    Const: {},
    ViewModels: {},
};
var markdowner = window.markdownit();


//if index is part of a repeat, return only the part beyond the deepest repeat
function relativeIndex(ix) {
    var steps = ix.split(',');
    var deepest_repeat = -1,
        i;
    for (i = steps.length - 2; i >= 0; i--) {
        if (steps[i].indexOf(':') != -1) {
            deepest_repeat = i;
            break;
        }
    }
    if (deepest_repeat == -1) {
        return ix;
    } else {
        var rel_ix = '-';
        for (i = deepest_repeat + 1; i < steps.length; i++) {
            rel_ix += steps[i] + (i < steps.length - 1 ? ',' : '');
        }
        return rel_ix;
    }
}

function getIx(o) {
    var ix = o.rel_ix();
    while (ix[0] == '-') {
        o = o.parent;
        if (!o) {
            break;
        }
        if (o.rel_ix().split(',').slice(-1)[0].indexOf(':') != -1) {
            ix = o.rel_ix() + ',' + ix.substring(1);
        }
    }
    return ix;
}

function getForIx(o, ix) {
    if (o.type == 'question') {
        return (getIx(o) == ix ? o : null);
    } else {
        for (var i = 0; i < o.children.length; i++) {
            var result = getForIx(o.children[i], ix);
            if (result) {
                return result;
            }
        }
    }
}

function ixInfo(o) {
    var full_ix = getIx(o);
    return o.rel_ix + (o.isRepetition ? '(' + o.uuid + ')' : '') + (o.rel_ix != full_ix ? ' :: ' + full_ix : '');
}

function parse_meta(type, style) {
    var meta = {};

    if (type == "date") {
        meta.mindiff = style.before !== null ? +style.before : null;
        meta.maxdiff = style.after !== null ? +style.after : null;
    } else if (type == "int" || type == "float") {
        meta.unit = style.unit;
    } else if (type == 'str') {
        meta.autocomplete = (style.mode == 'autocomplete');
        meta.autocomplete_key = style["autocomplete-key"];
        meta.mask = style.mask;
        meta.prefix = style.prefix;
        meta.longtext = (style.raw == 'full');
    } else if (type == "multiselect") {
        if (style["as-select1"]) {
            meta.as_single = [];
            var vs = style["as-select1"].split(',');
            for (var i = 0; i < vs.length; i++) {
                var k = +vs[i];
                if (k != 0) {
                    meta.as_single.push(k);
                }
            }
        }
    }

    if (type == "select" || type == "multiselect") {
        meta.appearance = style.raw;
    }

    return meta;
}

/**
 * Base abstract prototype for Repeat, Group and Form. Adds methods to
 * objects that contain a children array for rendering nested questions.
 * @param {Object} json - The JSON returned from touchforms to represent the container
 */
function Container(json) {
    var self = this;
    self.fromJS(json);

    /**
     * Used in KO template to determine what template to use for a child
     * @param {Object} child - The child object to be rendered, either Group, Repeat, or Question
     */
    self.childTemplate = function(child) {
        return ko.utils.unwrapObservable(child.type) + '-fullform-ko-template';
    }
}

/**
 * Reconciles the JSON representation of a Container (Group, Repeat, Form) and renders it into
 * a knockout representation.
 * @param {Object} json - The JSON returned from touchforms to represent a Container
 */
Container.prototype.fromJS = function(json) {
    var self = this;
    var mapping = {
        caption: {
            update: function(options) {
                return options.data ? DOMPurify.sanitize(options.data.replace(/\n/g, '<br/>')) : null;
            }
        },
        caption_markdown: {
            update: function(options) {
                return options.data ? markdowner.render(options.data) : null;
            }
        },
        children: {
            create: function(options) {
                console.log('creating');
                console.log(cmpkey(options.data));
                if (options.data.type === Formplayer.Const.QUESTION_TYPE) {
                    return new Question(options.data, self);
                } else if (options.data.type === Formplayer.Const.GROUP_TYPE) {
                    return new Group(options.data, self);
                } else if (options.data.type === Formplayer.Const.REPEAT_TYPE) {
                    return new Repeat(options.data, self);
                } else {
                    console.error('Could not find question type of ' + options.data.type);
                }
            },
            update: function(options) {
                if (options.data.datatype === Formplayer.Const.MULTI_SELECT) {
                    // Need to default to an array of strings instead of integers
                    options.data.answer = _.map(options.data.answer, function(d) { return '' + d });
                }
                return options.target
            },
            key: function(data) {
                return cmpkey(data);
            }
        }
    }
    ko.mapping.fromJS(json, mapping, self);
};

/**
 * Represents the entire form. There is only one of these on a page.
 * @param {Object} json - The JSON returned from touchforms to represent a Form
 */
function Form(json) {
    var self = this;
    json.children = json.tree;
    delete json.tree
    Container.call(self, json);
    self.submitText = ko.observable('Submit');
    self.evalXPath = new Formplayer.ViewModels.EvaluateXPath();

    self.submitForm = function(form) {
        $.publish('formplayer.submit-form', self);
    };

    $.unsubscribe('adapter');
    $.subscribe('adapter.reconcile', function(e, response) {
        response.children = response.tree;
        delete response.tree
        self.fromJS(response);
    });

    this.submitting = function() {
        this.submitText('Submitting...');
    };
}
Form.prototype = Object.create(Container.prototype);
Form.prototype.constructor = Container;

/**
 * Represents a group of questions.
 * @param {Object} json - The JSON returned from touchforms to represent a Form
 * @param {Object} parent - The object's parent. Either a Form, Group, or Repeat.
 */
function Group(json, parent) {
    var self = this;
    Container.call(self, json);

    self.parent = parent;
    self.rel_ix = ko.observable(relativeIndex(self.ix()));
    self.isRepetition = parent.isRepeat; // The Group belongs to a Repeat
    if (json.hasOwnProperty('domain_meta') && json.hasOwnProperty('style')) {
        self.domain_meta = parse_meta(json.datatype, val);
    }

    if (self.isRepetition) {
        self.rel_ix = ko.observable(relativeIndex(self.ix()));
    }

    self.deleteRepeat = function() {
        $.publish('formplayer.delete-repeat', self);
        $.publish('formplayer.dirty');
    };

}
Group.prototype = Object.create(Container.prototype);
Group.prototype.constructor = Container;

/**
 * Represents a repeat group. A repeat only has Group objects as children. Each child Group contains the
 * child questions to be rendered
 * @param {Object} json - The JSON returned from touchforms to represent a Form
 * @param {Object} parent - The object's parent. Either a Form, Group, or Repeat.
 */
function Repeat(json, parent) {
    var self = this;
    Container.call(self, json);

    self.parent = parent;
    self.rel_ix = ko.observable(relativeIndex(self.ix()));
    if (json.hasOwnProperty('domain_meta') && json.hasOwnProperty('style')) {
        self.domain_meta = parse_meta(json.datatype, val);
    }
    self.isRepeat = true;
    self.templateType = 'repeat';

    self.newRepeat = function() {
        $.publish('formplayer.new-repeat', self);
        $.publish('formplayer.dirty');
    };

}
Repeat.prototype = Object.create(Container.prototype);
Repeat.prototype.constructor = Container;

/**
 * Represents a Question. A Question contains an Entry which is the widget that is displayed for that question
 * type.
 * child questions to be rendered
 * @param {Object} json - The JSON returned from touchforms to represent a Form
 * @param {Object} parent - The object's parent. Either a Form, Group, or Repeat.
 */
function Question(json, parent) {
    var self = this;

    self.fromJS(json);
    self.parent = parent;
    self.error = ko.observable('');
    self.rel_ix = ko.observable(relativeIndex(self.ix()));
    if (json.hasOwnProperty('domain_meta') && json.hasOwnProperty('style')) {
        self.domain_meta = parse_meta(json.datatype, val);
    }

    self.is_select = (self.datatype() === 'select' || self.datatype() === 'multiselect');
    self.entry = getEntry(self);
    self.entryTemplate = function() {
        return self.entry.templateType + '-entry-ko-template';
    };
    self.afterRender = function() { self.entry.afterRender() };

    self.prevalidate = function() {
        return this.entry.prevalidate(this);
    }

    self.onchange = function() {
        $.publish('formplayer.dirty', true);
        if (self.prevalidate()) {
            $.publish('formplayer.answer-question', self);
        }
    }

    self.mediaSrc = function(resourceType) {
        if (!resourceType) { return ''; }
        return Formplayer.resourceMap(resourceType);
    }

    self.showError = function(content) {
        self.error(content);
    };

    self.clearError = function() {
        self.error(null);
    };

}

/**
 * Reconciles the JSON representation of a Question and renders it into
 * a knockout representation.
 * @param {Object} json - The JSON returned from touchforms to represent a Question
 */
Question.prototype.fromJS = function(json) {
    var self = this;
    var mapping = {
        caption: {
            update: function(options) {
                return options.data ? DOMPurify.sanitize(options.data.replace(/\n/g, '<br/>')) : null;
            }
        },
        caption_markdown: {
            update: function(options) {
                return options.data ? markdowner.render(options.data) : null;
            }
        },
    };

    if (json.datatype === Formplayer.Const.MULTI_SELECT) {
        json.answer = _.map(json.answer, function(d) { return '' + d });
    }
    ko.mapping.fromJS(json, mapping, self);
}


Formplayer.ViewModels.EvaluateXPath = function() {
    var self = this;
    self.xpath = ko.observable('');
    self.result = ko.observable('');
    self.success = ko.observable(true);
    self.evaluate = function(form) {
        var callback = function(result, status) {
            self.result(result);
            self.success(status === "success");
        };
        $.publish('formplayer.evaluate-xpath', [self.xpath(), callback]);
    };
}

/**
 * Used to compare if questions are equal to each other by looking at their index
 * @param {Object} e - Either the javascript object Question, Group, Repeat or the JSON representation
 */
var cmpkey = function(e) {
    var ix = ko.utils.unwrapObservable(e.ix);
    if (e.uuid) {
        return 'uuid-' + ko.utils.unwrapObservable(e.uuid);
    } else {
        return 'ix-' + (ix ? ix : getIx(e));
    }
}

/**
 * Given an element Question, Group, or Repeat, this will determine the index of the element in the set of
 * elements passed in. Returns -1 if not found
 * @param {Object} e - Either the javascript object Question, Group, Repeat or the JSON representation
 * @param {Object} set - The set of objects, either Question, Group, or Repeat to search in
 */
var ixElementSet = function(e, set) {
    return $.map(set, function(val) {
        return cmpkey(val);
    }).indexOf(cmpkey(e));
}

/**
 * Given an element Question, Group, or Repeat, this will return the element in the set of
 * elements passed in. Returns null if not found
 * @param {Object} e - Either the javascript object Question, Group, Repeat or the JSON representation
 * @param {Object} set - The set of objects, either Question, Group, or Repeat to search in
 */
var inElementSet = function(e, set) {
    var ix = ixElementSet(e, set);
    return (ix !== -1 ? set[ix] : null);
}


function scroll_pin(pin_threshold, $container, $elem) {
    return function() {
        var base_offset = $container.offset().top;
        var scroll_pos = $(window).scrollTop();
        var elem_pos = base_offset - scroll_pos;
        var pinned = (elem_pos < pin_threshold);

        $elem.css('top', pinned ? pin_threshold + 'px' : base_offset);
    };
}

function set_pin(pin_threshold, $container, $elem) {
    var pinfunc = scroll_pin(pin_threshold, $container, $elem);
    $(window).scroll(pinfunc);
    pinfunc();
}


/**
 * Compares the equality of two answer sets.
 * @param {(string|string[])} answer1 - A string of answers or a single answer
 * @param {(string|string[])} answer2 - A string of answers or a single answer
 */
Formplayer.Utils.answersEqual = function(answer1, answer2) {
    if (answer1 === answer2) {
        return true;
    } else if (answer1 instanceof Array && answer2 instanceof Array) {
        return _.isEqual(answer1, answer2);
    }
    return false;
}

/**
 * Initializes a new form to be used by the formplayer.
 * @param {Object} formJSON - The json representation of the form
 * @param {Object} resourceMap - Function for resolving multimedia paths
 * @param {Object} $div - The jquery element that the form will be rendered in.
 */
Formplayer.Utils.initialRender = function(formJSON, resourceMap, $div) {
    var form = new Form(formJSON);
    Formplayer.resourceMap = resourceMap;
    ko.cleanNode($div[0]);
    ko.applyBindings(form, $div[0]);
    return form;
};

Formplayer.Const = {
    GROUP_TYPE: 'sub-group',
    REPEAT_TYPE: 'repeat-juncture',
    QUESTION_TYPE: 'question',

    // Entry types
    STRING: 'str',
    INT: 'int',
    LONG_INT: 'longint',
    FLOAT: 'float',
    SELECT: 'select',
    MULTI_SELECT: 'multiselect',
    DATE: 'date',
    TIME: 'time',
    GEO: 'geo',
    INFO: 'info',
};
