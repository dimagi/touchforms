this["JST"] = this["JST"] || {};

this["JST"]["formplayer/templates/formplayer/fullform-ui/form.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div>\n    <h1 id="title"></h1>\n    <div id="form"></div>\n    <input id="submit" type="submit" value="Submit" />\n</div>\n';

}
return __p
};

this["JST"]["formplayer/templates/formplayer/fullform-ui/group.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="gr">\n    <div class="gr-header">\n        <span id="caption"></span>\n        <span id="ix"></span>\n        <a id="del" href="#">delete</a>\n    </div>\n    <div id="children"></div>\n</div>\n';

}
return __p
};

this["JST"]["formplayer/templates/formplayer/fullform-ui/question.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 if (datatype !== 'info') { ;
__p += '\n<div class="q">\n    <div id="widget"></div>\n    <span id="req"></span>\n    <span id="caption"></span>\n    <span id="ix"></span>\n    <div id="error"></div>\n    <div class="eoq"></div/>\n</div>\n';
 } else { ;
__p += '\n<div class="info">\n    <span id="ix"></span>\n    <span id="caption"></span>\n</div>\n';
 } ;
__p += '\n';

}
return __p
};

this["JST"]["formplayer/templates/formplayer/fullform-ui/repeat.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="rep">\n    <div class="rep-header">\n        <span id="caption"></span>\n        <span id="ix"></span>\n    </div>\n    <div id="children"></div>\n    <div id="empty">This repeatable group is empty</div>\n    <div class="rep-footer">\n        <a id="add" href="#">add new</a>\n    </div>\n</div>\n';

}
return __p
};