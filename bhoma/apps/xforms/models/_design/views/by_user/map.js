function(doc) { 
    // !code util/xforms.js
    
    if (doc["#doc_type"] == "XForm" && get_user_id(doc) != null) {
        date = get_encounter_date(doc);
        if (!date) {
            date = Date();
        }
        emit([get_user_id(doc), date.getFullYear(), date.getMonth(), date.getDate(), doc["@xmlns"], get_clinic_id(doc)], 1);
    } 
}