function(doc) {
    // these lines magically import our other javascript files.  DON'T REMOVE THEM!
    // !code util/schema.js
    
    if (doc["#doc_type"] == "XForm") {
        emit(doc["@xmlns"], get_schema(doc));
    }
}