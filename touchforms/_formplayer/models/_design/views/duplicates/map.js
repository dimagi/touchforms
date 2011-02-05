function(doc) { 
    if (doc["#doc_type"] == "XForm") {
        emit(doc["#sha1"], 1);
    } 
}