function(doc) { 
    // !code util/xforms.js
    
    if (doc["#doc_type"] == "XForm") {
        date = get_encounter_date(doc);
        if (!date) {
            date = Date();
        }
        emit([doc["@xmlns"], get_clinic_id(doc), date.getFullYear(), date.getMonth(), date.getDate()], 1);
    } 
}