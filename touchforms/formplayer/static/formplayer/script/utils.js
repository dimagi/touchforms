Formplayer.Utils.touchformsError = function(message) {
    return Formplayer.Errors.GENERIC_ERROR + message;
}

/**
 * Compares the equality of two answer sets.
 * @param {(string|string[])} answer1 - A string of answers or a single answer
 * @param {(string|string[])} answer2 - A string of answers or a single answer
 */
Formplayer.Utils.answersEqual = function(answer1, answer2) {
    if (answer1 instanceof Array && answer2 instanceof Array) {
        return _.isEqual(answer1, answer2);
    } else if (answer1 === answer2) {
        return true;
    }
    return false;
};

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

