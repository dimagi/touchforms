function(doc) { 
    if (doc["#doc_type"] == "XForm") 
        emit([doc["@xmlns"], doc.meta.clinic_id, doc.encounter_date ], 1); 
}