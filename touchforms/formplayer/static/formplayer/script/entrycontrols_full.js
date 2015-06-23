/**
 * The base Object for all entries. Each entry takes a question object and options
 * @param {Object} question - A question object
 * @param {Object} object - A hash of different options
 */
function Entry(question, options) {
    var self = this;
    self.question = question;
    self.answer = question.answer;
    self.datatype = question.datatype();
    self.entryId = _.uniqueId(this.datatype);

    self.prevalidate = function(q) {
        return true;
    };
    self.clear = function() {
        this.answer(null);
    };
    self.afterRender = function() {
      // Override with any logic that comes after rendering the Entry
    };
    if (self.answer) {
        self.answer.subscribe(self.onAnswerChange.bind(self));
    }
}
Entry.prototype.onAnswerChange = function(newValue) {};


/**
 * An entry that represent a question label.
 */
function InfoEntry(question, options) {
    var self = this;
    Entry.call(self, question, options);
    self.answer = question.answer;
    self.templateType = 'blank';
};

InfoEntry.prototype = Object.create(Entry.prototype);
InfoEntry.prototype.constructor = Entry;


/**
 * The entry used when we have an unidentified entry
 */
function UnsupportedEntry(question, options) {
    var self = this;
    Entry.call(self, question, options);
    self.templateType = 'unsupported';
    self.answer = null;
}
UnsupportedEntry.prototype = Object.create(Entry.prototype);
UnsupportedEntry.prototype.constructor = Entry;


/**
 * The entry that represents a free text input
 * TODO: Handle prose option
 */
function FreeTextEntry(question, options) {
    var self = this;
    Entry.call(self, question, options);
    self.templateType = 'str';
    self.domain = question.domain ? question.domain() : 'full';
    self.lengthLimit = options.lengthLimit || 10000;
    self.prose = question.domain_meta ? question.domain_meta().longtext : false;

    self.prevalidate = function() {
        var errmsg = this._prevalidate(self.answer());
        if (errmsg) {
            self.question.showError(errmsg);
            return false;
        }
        return true;
    }

    self._prevalidate = function(raw) {
        return null;
    };

    self.domainText = function() {
        return '(free-text)';
    };
}
FreeTextEntry.prototype = Object.create(Entry.prototype);
FreeTextEntry.prototype.constructor = Entry;

FreeTextEntry.prototype.onAnswerChange = function(newValue) {
    var self = this;
    self.question.onchange();
};


function PasswordEntry(question, options) {
    options.lengthLimit = options.lengthLimit || 9;

    this.mkWidget = function() {
        $('#answer')[0].innerHTML = '<input id="textfield" maxlength="' + this.lengthLimit + '" type="passwd"/>';
        this.inputfield = $('#textfield')[0];
    };
}
PasswordEntry.prototype = Object.create(FreeTextEntry.prototype);
PasswordEntry.prototype.constructor = FreeTextEntry;


/**
 * The entry that defines an integer input. Only accepts whole numbers
 */
function IntEntry(question, options) {
    FreeTextEntry.call(this, question, options);
    this.templateType = 'int';
    this.lengthLimit = options.lengthLimit;

    this._prevalidate = function(raw) {
        return (isNaN(+raw) || +raw != Math.floor(+raw) ? "Not a valid whole number" : null);
    }

    this.domainText = function() {
        return 'numeric';
    };

}
IntEntry.prototype = Object.create(FreeTextEntry.prototype);
IntEntry.prototype.constructor = FreeTextEntry;


function PhoneEntry(question, options) {
    IntEntry.call(this, question, options);

    this._prevalidate = function(raw) {
        return (!(/^\+?[0-9]+$/.test(raw)) ? "This does not appear to be a valid phone/numeric number" : null);
    };

    this.domainText = function() {
        return 'phone/numeric';
    };

}
PhoneEntry.prototype = Object.create(IntEntry.prototype);
PhoneEntry.prototype.constructor = IntEntry;


/**
 * The entry that defines an float input. Only accepts real numbers
 */
function FloatEntry(question, options) {
    FreeTextEntry.call(this, question, options);
    this.templateType = 'float';

    this._prevalidate = function(raw) {
        return (isNaN(+raw) ? "Not a valid number" : null);
    }

    this.domainText = function() {
        return 'decimal';
    }
}
FloatEntry.prototype = Object.create(IntEntry.prototype);
FloatEntry.prototype.constructor = IntEntry;


/**
 * Represents a checked box entry.
 */
function MultiSelectEntry(question, options) {
    var self = this;
    Entry.call(this, question, options);
    self.templateType = 'select';
    self.choices = question.choices;
    self.choicevals = question.choicevals ? question.choicevals() : null;
    self.isMulti = true;

    self.onClear = function() {
        self.answer([]);
    };

    self.COMMIT_DELAY = 300; //ms
    self.pendchange = function(immed) {
        if (self.timer) {
            clearTimeout(self.timer);
        }
        if (immed) {
          self.question.onchange();
        } else {
          self.timer = setTimeout(self.question.onchange, self.COMMIT_DELAY);
        }
    };

    var previousAnswer = null;
    self.answer.subscribe(function(oldValue) {
        if (_.isArray(oldValue)) {
            // Need to make copy since oldValue gets mutated
            self.previousAnswer = oldValue.slice();
        } else {
            self.previousAnswer = oldValue;
        }
    }, self, 'beforeChange');
}
MultiSelectEntry.prototype = Object.create(Entry.prototype);
MultiSelectEntry.prototype.constructor = Entry;

MultiSelectEntry.prototype.onAnswerChange = function(newValue) {
    var self = this;
    if (Formplayer.Utils.answersEqual(self.previousAnswer, newValue)) {
        return;
    }
    // delay change when there are multiple values, could be doing a lot of checks
    self.pendchange(_.isArray(newValue) ? !newValue.length : true);
};


/**
 * Represents multiple radio button entries
 */
function SingleSelectEntry(question, options) {
    var self = this;
    MultiSelectEntry.call(this, question, options);
    self.templateType = 'select';
    self.isMulti = false;
    self.onClear = function() { self.answer(null); };
}
SingleSelectEntry.prototype = Object.create(MultiSelectEntry.prototype);
SingleSelectEntry.prototype.constructor = MultiSelectEntry;


function DateEntry(question, options) {
    var self = this;
    Entry.call(self, question, options);
    var thisYear = new Date().getFullYear() + 1;
    self.templateType = 'date';
    self.format = 'mm/dd/yy';

    self.afterRender = function() {
        self.$picker = $('#' + self.entryId);
        self.$picker.datepicker({
            changeMonth: true,
            changeYear: true,
            dateFormat: this.format,
            yearRange: "" + (thisYear - 100) + ":" + (thisYear + 10),
        });
        self.$picker.change(function() {
            var raw = self.$picker.datepicker('getDate');
            self.answer(raw ? $.datepicker.formatDate('yy-mm-dd', raw) : null);
        });
    }

    self.answer = question.answer;
    self.answer.subscribe(function(newValue) {
        self.question.onchange();
    });

};
DateEntry.prototype = Object.create(Entry.prototype);
DateEntry.prototype.constructor = Entry;


function TimeEntry(question, options) {
    var self = this;
    FreeTextEntry.call(self, question, options);

    self._prevalidate = function(raw) {
        var timeParts = self.parseAnswer(raw);
        if (timeParts === null ||
                timeParts.hour < 0 || timeParts.hour >= 24 ||
                timeParts.min < 0 || timeParts.min >= 60) {
            return "Not a valid time (00:00 - 23:59)";
        }
        return null;
    };

    self.parseAnswer = function(answer) {
        var match = /^([0-9]{1,2})\:([0-9]{2})$/.exec($.trim(answer));
        if (!match) { return null; }
        return {
            hour: +match[1],
            min: +match[2]
        };
    };

    self.domainText = function() {
        return 'hh:mm, 24-hour clock';
    };
}
TimeEntry.prototype = Object.create(FreeTextEntry.prototype);
TimeEntry.prototype.constructor = FreeTextEntry;

TimeEntry.prototype.onAnswerChange = function(newValue) {
    var self = this,
        timeParts = self.parseAnswer(self.answer()),
        formatted;
    if (timeParts) {
        formatted = intpad(timeParts.hour, 2) + ':' + intpad(timeParts.min, 2);
        if (formatted !== self.answer()) {
            self.answer(formatted);
            return;
        }
    }
    self.question.onchange();
};


function GeoPointEntry(question, options) {
    var self = this;
    Entry.call(self, question, options);
    self.templateType = 'geo';
    self.apiKey = 'https://maps.googleapis.com/maps/api/js?key=' + window.GMAPS_API_KEY + '&sensor=false';
    self.map = null;
    self.lat = ko.observable(self.answer() ? self.answer()[0] : null);
    self.lon = ko.observable(self.answer() ? self.answer()[1] : null);

    self.lat.subscribe(function(newValue) {
        self.answer([newValue, self.answer() ? self.answer()[1] : null]);
    });
    self.lon.subscribe(function(newValue) {
        self.answer([self.answer() ? self.answer()[0] : null, newValue]);
    });

    self.DEFAULT = {
        lat: 30,
        lon: 0,
        zoom: 1,
        anszoom: 6
    };

    self.onClear = function() {
        self.lat(null);
        self.lon(null);
    };

    window.gMapsCallback = function() {
        self.geocoder = new google.maps.Geocoder();
        self.map = new google.maps.Map($('#' + self.entryId)[0], {
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            center: new google.maps.LatLng(self.DEFAULT.lat, self.DEFAULT.lon),
            zoom: self.DEFAULT.zoom
        });
        if (self.answer()) {
            self.map.setCenter(new google.maps.LatLng(self.lat(), self.lon()));
            self.map.setZoom(self.DEFAULT.anszoom);
        }
        google.maps.event.addListener(self.map, "center_changed", self.updateCenter.bind(self));
    }
    self.afterRender = function() {
        if (typeof google === "undefined") {
            $.getScript(self.apiKey + '&callback=gMapsCallback');
        }
    };

    self.updateCenter = function() {
        var center = self.map.getCenter();
        self.lat(center.lat());
        self.lon(center.lng());
    };

    self.formatLat = function(coordinate) { return self.formatCoordinate(coordinate, ['N', 'S']); };
    self.formatLon = function(coordinate) { return self.formatCoordinate(coordinate, ['E', 'W']); };
    self.formatCoordinate = function(coordinate, cardinalities) {
        var cardinality = coordinate >= 0 ? cardinalities[0] : cardinalities [1];
        if (coordinate !== null) {
            return cardinality + intpad(intpad(Math.abs(coordinate).toFixed(5), 8));
        }
        return '??.?????';
    };

    self.search = function(form) {
        var query = $(form).find('.query').val();
        self.geocoder.geocode({
            'address': query
        }, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                self.map.fitBounds(results[0].geometry.viewport);
                self.map.setCenter(results[0].geometry.location);
            }
        });
    };

    var previousAnswer = null;
    self.answer.subscribe(function(oldValue) {
        if (_.isArray(oldValue)) {
            // Need to make copy since oldValue gets mutated
            self.previousAnswer = oldValue.slice();
        } else {
            self.previousAnswer = oldValue;
        }
    }, self, 'beforeChange')
};
GeoPointEntry.prototype = Object.create(Entry.prototype);
GeoPointEntry.prototype.constructor = Entry;

GeoPointEntry.prototype.onAnswerChange = _.debounce(function(newValue) {
    var self = this;
    if (Formplayer.Utils.answersEqual(self.previousAnswer, newValue)) {
        return;
    }
    self.question.onchange();
}, 200);


/**
 * Gets the entry based on the datatype of the Question
 * @param {Object} question - A Question object
 */
function getEntry(question) {
    var entry = null;
    var options = {};

    switch (question.datatype()) {
        case Formplayer.Const.STRING:
            entry = new FreeTextEntry(question, {});
            break;
        case Formplayer.Const.INT:
            entry = new IntEntry(question, {});
            break;
        case Formplayer.Const.LONGINT:
            entry = new IntEntry(question, { lengthLimit: 15 });
            break;
        case Formplayer.Const.FLOAT:
            entry = new FloatEntry(question, {});
            break;
        case Formplayer.Const.PASSWORD:
            entry = new PasswordEntry(question, {});
            break;
        case Formplayer.Const.SELECT:
            entry = new SingleSelectEntry(question, {});
            break;
        case Formplayer.Const.MULTI_SELECT:
            entry = new MultiSelectEntry(question, {});
            break;
        case Formplayer.Const.DATE:
            entry = new DateEntry(question, {});
            break;
        case Formplayer.Const.TIME:
            entry = new TimeEntry(question, {});
            break;
        case Formplayer.Const.GEO:
            entry = new GeoPointEntry(question, {});
            break;
        case Formplayer.Const.INFO:
            entry = new InfoEntry(question, {});
            break;
        default:
            console.warn('No active entry for: ' + question.datatype());
            entry = new UnsupportedEntry(question, options);
    }
    return entry;
}

function intpad(x, n) {
    var s = x + '';
    while (s.length < n) {
        s = '0' + s;
    }
    return s;
};
