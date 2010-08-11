function(doc) { 
    // parse a date in yyyy-mm-dd format
	function parse_date(date_string) {
	    // hat tip: http://stackoverflow.com/questions/2587345/javascript-date-parse    
	    var parts = date_string.match(/(\d+)/g);
	    // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
	    return new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
	}
     
	function get_encounter_date(xform_doc) {
	    return parse_date(xform_doc.encounter_date);
	}
    
    if (doc["#doc_type"] == "XForm") {
        date = get_encounter_date(doc);
        if (!date) {
            date = Date();
        }
        emit([doc["@xmlns"], doc.meta.clinic_id, date.getFullYear(), date.getMonth(), date.getDate()], 1);
    } 
}