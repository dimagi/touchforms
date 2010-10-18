function(doc, req) {
    var e4xmlJsonClass = require("util/jsone4xml").e4xmlJsonClass;
    var base64Class = require("util/base64").Base64;
    
    
    e4xmlJsonClass.hello()
    base64Class.hello();
    
    if (doc) {
        log("doc wasn't null!  this is unexpected! you will LOSE your information in favor of the xml");
    }
    
    // Workaround: Mozilla Bug 336551
    // see https://developer.mozilla.org/en/E4X
    var content = req.body.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, "");
    var xml_content = new XML(content); 
    doc = e4xmlJsonClass.xml2obj(xml_content);
        
    var getUuid = function(doc) {
        // search for a uuid in some known places
        // CZUE: stop using the uid from the form.  It creates all kinds of other problems
        // with document update conflicts
        /*
        var other_uuid = doc["uuid"];
        if (doc["uuid"]) return doc["uuid"];
        if (doc["Meta"] && doc["Meta"]["uid"]) return doc["Meta"]["uid"];
        */
        var guid = function() {
            // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
            // TODO: find a better guid generator / plug into couch uuid framework
            var S4 = function() { 
                return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
            }
            return (S4()+S4()+S4()+S4()+S4()+S4()+S4()+S4());   
        }
        return guid();
    }
    
    uuid = getUuid(doc);
    doc["_id"] = uuid.toString();
    
    // attach the raw xml as a file called "form.xml"
    // This has to be base64 encoded to store properly in couch.
    var attachments = { "form.xml" : { "content_type":"text/xml", "data": base64Class.encode(req.body) } };      
    doc["_attachments"] = attachments;
    
    // add some special fields
    doc["#doc_type"] = "XForm";    // doc type
    doc["#received_on"] = Date();  // timestamp
    doc["#export_tag"] = "@xmlns"; // export tag for .xls export
    
    // HACK / MAGIC - python couchdbkit ignores capital meta so always lowercase it
    if (doc["Meta"]) {
        doc["meta"] = doc["Meta"];
        doc["Meta"] = null;
    } 
    var resp =  {"headers" : {"Content-Type" : "text/plain"},
                 "body" : uuid.toString()};
    return [doc, resp];
}

