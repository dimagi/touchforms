function(doc, req)
{   
    if(doc.clinic_id) {
        if(doc.clinic_id == req.query.clinic_id) {
            return true;
        }
    }
    return false;
}