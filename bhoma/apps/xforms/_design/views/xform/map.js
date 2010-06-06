function(doc) { 
    if (doc.doc_type == "Patient") 
        emit(doc._id, doc); 
}