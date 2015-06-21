/**
 * The base Object for all entries. Each entry takes a question object and options
 * @param {Object} question - A question object
 * @param {Object} object - A hash of different options
 */
function Entry(question, options) {
    this.question = question
    this.datatype = question.datatype();
    this.entryId = this.datatype + nonce();

    this.prevalidate = function(q) {
        return true;
    }
    this.clear = function() {
        this.answer(null);
    }
}

/**
 * An entry that represent a question label.
 */
function InfoEntry(question, options) {
    Entry.call(self, question, options);
    this.answer = question.answer;
    this.templateType = 'blank'
};

InfoEntry.prototype = Object.create(Entry.prototype);
InfoEntry.prototype.constructor = Entry;

/**
 * The entry used when we have an unidentified entry
 */
function UnsupportedEntry(question, options) {
    Entry.call(self, question, options);
    this.templateType = 'unsupported'
    this.answer = null;
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

    self.answer = question.answer;
    self.answer.subscribe(function(newValue) {
        self.question.onchange()
    });

    this.prevalidate = function() {
        var errmsg = this._prevalidate(self.answer());
        if (errmsg) {
            self.question.showError(errmsg);
            return false;
        }
        return true;
    }

    this._prevalidate = function(raw) {
        return null;
    }

    this.domainText = function() {
        return '(free-text)';
    }
}
FreeTextEntry.prototype = Object.create(Entry.prototype);
FreeTextEntry.prototype.constructor = Entry;

function PasswordEntry(question, options) {
    options.lengthLimit = options.lengthLimit || 9;

    this.mkWidget = function() {
        $('#answer')[0].innerHTML = '<input id="textfield" maxlength="' + this.lengthLimit + '" type="passwd"/>';
        this.inputfield = $('#textfield')[0];
    }
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
    }

}
IntEntry.prototype = Object.create(FreeTextEntry.prototype);
IntEntry.prototype.constructor = FreeTextEntry;

function PhoneEntry(question, options) {
    IntEntry.call(this, question, options);

    this._prevalidate = function(raw) {
        return (!(/^\+?[0-9]+$/.test(raw)) ? "This does not appear to be a valid phone/numeric number" : null);
    }

    this.domainText = function() {
        return 'phone/numeric';
    }

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
    self.answer = question.answer;

    self.group = nonce();

    self.isMulti = true;
    self.default_selections = null;

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
            previousAnswer = oldValue.slice();
        } else {
            previousAnswer = oldValue;
        }
    }, self, 'beforeChange');

    self.answer.subscribe(function(newValue) {
      if (Formplayer.Utils.answersEqual(previousAnswer, newValue)) {
          return;
      }
      // delay change when there are multiple values, could be doing a lot of checks
      self.pendchange(_.isArray(newValue) ? !newValue.length : true);
    });

}
MultiSelectEntry.prototype = Object.create(Entry.prototype);
MultiSelectEntry.prototype.constructor = Entry;

/**
 * Represents multiple radio button entries
 */
function SingleSelectEntry(question, options) {
    var self = this;
    MultiSelectEntry.call(this, question, options);
    self.templateType = 'select';

    self.isMulti = false;

    self.onClear = function() {
        self.answer(null)
    };
}
SingleSelectEntry.prototype = Object.create(MultiSelectEntry.prototype);
SingleSelectEntry.prototype.constructor = MultiSelectEntry;

function DateEntry(question, options) {
    var self = this;
    Entry.call(self, question, options);
    var thisYear = new Date().getFullYear() + 1;

    this.format = 'mm/dd/yy';

    this.$picker = $('#' + this.entryId);
    this.$picker.datepicker({
        changeMonth: true,
        changeYear: true,
        dateFormat: this.format,
        yearRange: "" + (thisYear - 100) + ":" + (thisYear + 10),
    });


    this.setAnswer(this.def_ans);

    this.$picker.change(function() {
        q.onchange();
    });

    this.load = function(q, $container) {
        this.widget_id = 'datepicker-' + nonce();
        $container.html('<input id="' + this.widget_id + '" type="text"><span id="type" style="margin-left: 15px; font-size: x-small; font-style: italic; color: grey;">(' + this.format.replace('yy', 'yyyy') + ')</span>');
        this.$picker = $container.find('#' + this.widget_id);
        var thisYear = new Date().getFullYear() + 1;
        this.$picker.datepicker({
            changeMonth: true,
            changeYear: true,
            dateFormat: this.format,
            yearRange: "" + (thisYear - 100) + ":" + (thisYear + 10),
        });


        this.setAnswer(this.def_ans);

        this.$picker.change(function() {
            q.onchange();
        });
    }

    this.setAnswer = function(answer, postLoad) {
        this.$picker.datepicker('setDate', answer ? $.datepicker.parseDate('yy-mm-dd', answer) : null);
        this.ans = answer;
    }

    this.getAnswer = function() {
        var raw = this.$picker.datepicker('getDate');
        return (raw != null ? $.datepicker.formatDate('yy-mm-dd', raw) : null);
    }

}
DateEntry.prototype = Object.create(Entry.prototype);
DateEntry.prototype.constructor = Entry;

function TimeOfDayEntry(question, options) {
    FreeTextEntry.call(question, options);

    this.getAnswer = function() {
        var val = this.parent('getAnswer')();
        var t = this.parseAnswer(val);
        if (t != null) {
            return intpad(t.h, 2) + ':' + intpad(t.m, 2);
        } else {
            return null;
        }
    }

    this._prevalidate = function(raw) {
        var t = this.parseAnswer($.trim(raw));
        if (t == null || t.h < 0 || t.h >= 24 || t.m < 0 || t.m >= 60) {
            return "Not a valid time (00:00\u201423:59)";
        } else {
            return null;
        }
    }

    this.parseAnswer = function(answer) {
        var match = /^([0-9]{1,2})\:([0-9]{2})$/.exec(answer);
        if (!match) {
            return null;
        } else {
            return {
                h: +match[1],
                m: +match[2]
            };
        }
    }

    this.domainText = function() {
        return 'hh:mm, 24-hour clock';
    }

    this.widgetWidth = function() {
        return '5em';
    }
}
TimeOfDayEntry.prototype = Object.create(FreeTextEntry.prototype);
TimeOfDayEntry.prototype.constructor = FreeTextEntry;

function GeoPointEntry(question, options) {
    Entry.call(question, options);

    this.timers = {};
    this.DEFAULT = {
        lat: 30.,
        lon: 0.,
        zoom: 1,
        anszoom: 6
    };

    this.load = function(q, $container) {
        this.mkWidget(q, $container);
        this.setAnswer(this.default_answer, true);

        this.commit = function() {
            q.onchange();
        }
    }

    this.mkWidget = function(q, $container) {
        var crosshairs = 'iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAQAAADYWf5HAAAACXZwQWcAAAATAAAAEwDxf4yuAAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAAAEgAAABIAEbJaz4AAAAySURBVCjPY2hgIAZiCPwHAyKUMQxbZf9RAHKwIMSg+hEQqhtJBK6MKNNGTvCSld6wQwBd8RoA55WDIgAAAABJRU5ErkJggg==';
        var crosshair_size = 19;
        $container.html('<style>#map img { max-width: none !important; }</style><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td id="lat"></td><td id="lon"></td><td align="right" valign="bottom"><a id="clear" href="#">clear</a></td></tr></table><div id="map"></div><div><form><input id="query"><input type="submit" id="search" value="Search"></form></div>');
        var $map = $container.find('#map');
        // TODO: dynamic sizing
        var W = 400;
        var H = 250;
        $map.css('width', W + 'px');
        $map.css('height', H + 'px');

        $map.css('background', '#eee');

        var $wait = $('<div />');
        $wait.css('margin', 'auto');
        $wait.css('padding-top', '60px');
        $wait.css('max-width', '200px');
        $wait.css('color', '#bbb');
        $wait.css('font-size', '24pt');
        $wait.css('line-height', '28pt');
        $wait.text('please wait while the map loads...');
        $map.append($wait);

        this.lat = null;
        this.lon = null;
        this.$lat = $container.find('#lat');
        this.$lon = $container.find('#lon');
        $.each([this.$lat, this.$lon], function(i, $e) {
            $e.css('font-weight', 'bold');
            $e.css('width', '8em');
        });

        var widget = this;
        $container.find('#clear').click(function() {
            widget.set_latlon(null, null);
            widget.commit();
            return false;
        });

        this.$query = $container.find('#query');
        this.$query.css('width', '80%');
        this.$search = $container.find('#search');
        this.$search.css('width', '15%');
        this.$search.click(function() {
            q = widget.$query.val().trim();
            if (q) {
                widget.search(q);
            }
            return false;
        });

        var on_gmap_load = function() {
            if (!$container.is(':visible')) {
                // google maps gets unhappy if you initialize the map when its <div> is hidden
                widget.delayed_init_reqd = true;
            }

            $map.empty();
            widget.map = new google.maps.Map($map[0], {
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                center: new google.maps.LatLng(widget.DEFAULT.lat, widget.DEFAULT.lon),
                zoom: widget.DEFAULT.zoom
            });

            widget.geocoder = new google.maps.Geocoder();

            if (!widget.delayed_init_reqd) {
                widget.bindListener();
            }

            $ch = $('<img src="data:image/png;base64,' + crosshairs + '">');
            $ch.css('position', 'relative')
            $ch.css('top', ((H /*$map.height()*/ - crosshair_size) / 2) + 'px');
            $ch.css('left', ((W /*$map.width()*/ - crosshair_size) / 2) + 'px');
            $ch.css('z-index', '500');
            $map.append($ch);
        };

        var GMAPS_API = 'https://maps.googleapis.com/maps/api/js?key=' + GMAPS_API_KEY + '&sensor=false';
        if (typeof google == "undefined") {
            _GMAPS_INIT = on_gmap_load
            $.getScript(GMAPS_API + '&callback=_GMAPS_INIT');
        } else {
            on_gmap_load();
        }

    }

    this.bindListener = function() {
        var widget = this;
        google.maps.event.addListener(widget.map, "center_changed", function() {
            widget.update_center();
        });
    }

    this.onShow = function() {
        if (!this.delayed_init_reqd) {
            return;
        }

        // if the google map is initialized while the container div is hidden
        // we need to do a little cleanup
        var center = this.map.getCenter();
        google.maps.event.trigger(this.map, 'resize');
        this.map.setCenter(center);
        // only set this now so the re-centering doesn't trigger an 'answering' of the question
        this.bindListener();
    }

    this.getAnswer = function() {
        return (this.lat != null ? [this.lat, this.lon] : null);
    }

    this.setAnswer = function(answer, postLoad) {
        if (postLoad) {
            if (answer) {
                this.set_latlon(answer[0], answer[1]);
                if (this.map) {
                    this.map.setCenter(new google.maps.LatLng(answer[0], answer[1]));
                    this.map.setZoom(this.DEFAULT.anszoom);
                }
            } else {
                this.set_latlon(null, null);
            }
        } else {
            this.default_answer = answer;
        }
    }

    this.update_center = function() {
        var center = this.map.getCenter();
        var lat = center.lat();
        var lon = center.lng();

        if (this.set_latlon(lat, lon)) {
            var widget = this;
            this.delay_action('move', function() {
                widget.commit();
            }, 1.);
        }
    }

    this.set_latlon = function(lat, lon) {
        lon = lon % 360.;
        if (lon < 0) {
            lon += 360.
        }
        lon = lon % 360.;
        if (lon >= 180.) {
            lon -= 360.;
        }

        if (lat == this.lat && lon == this.lon) {
            return false;
        }

        this.lat = lat;
        this.lon = lon;

        this.$lat.text(lat != null ? (lat >= 0. ? 'N' : 'S') + intpad(Math.abs(lat).toFixed(5), 8) : '??.?????');
        this.$lon.text(lat != null ? (lon >= 0. ? 'E' : 'W') + intpad(Math.abs(lon).toFixed(5), 9) : '???.?????');

        return true;
    }

    this.delay_action = function(tag, dofunc, delay) {
        var timer = this.timers[tag];
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        this.timers[tag] = setTimeout(dofunc, 1000 * delay);
    }

    this.search = function(query) {
        var map = this.map;
        this.geocoder.geocode({
            'address': query
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.fitBounds(results[0].geometry.viewport);
                map.setCenter(results[0].geometry.location);
            }
        });
    }
}
GeoPointEntry.prototype = Object.create(Entry.prototype);
GeoPointEntry.prototype.constructor = Entry;

/**
 * Gets the entry based on the datatype of the Question
 * @param {Object} question - A Question object
 */
function getEntry(question) {
    var entry = null;
    var options = {};

    switch (question.datatype()) {
        case Formplayer.Const.STRING:
            entry = new FreeTextEntry(question, {})
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
            entry = new DateEntry(question, {})
            break;
        case Formplayer.Const.TIME:
            entry = new TimeOfDayEntry(question, {});
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
};

function nonce() {
    return Math.floor(Math.random() * 1e9);
}

function intpad(x, n) {
    var s = x + '';
    while (s.length < n) {
        s = '0' + s;
    }
    return s;
}
