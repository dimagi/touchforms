function(key, values) {
    // these lines magically import our other javascript files.  DON'T REMOVE THEM!
    // !code util/schema.js
    
    var depth = 0;
    
    function reconcile(type1, type2) {
        if (depth > 20)
            return log("Recursion depth too high!!!!");
        depth += 1;
        var type;
        var kind1 = get_kind(type1);
        var kind2 = get_kind(type2);

        if (kind1 != kind2) {
            if(kind1 == "null" || kind2 == "null") {
                if(kind1 == "null") {
                    type = type2;
                }
                else if (kind2 == "null") {
                    type = type1;
                }
                if(get_kind(type) == "list") {
                    type = [reconcile_list(type)];
                }
            }
            else if (kind1 == 'list') {
                type = reconcile(type1, [type2]);
            }
            else if (kind2 = 'list') {
                type = reconcile([type1], type2)
            }
            else {
                log("Cannot Reconsile!!");
                type = null;
            }
        }
        else {
            if(kind1 == 'dict') {
                type = {};
                for(var key in type2) {
                    type[key] = reconcile(type1[key], type2[key]);
                }
            }
            else if(kind1 == 'list') {
                type = [reconcile(reconcile_list(type1), reconcile_list(type2))];
            }
            else {
                type = type1;
            }
        }
        if (depth > 5) {
            log(depth);
            log(kind1 + ":\n\t" + uneval(type1));
            log(kind2 + ":\n\t" + uneval(type2));
            log(uneval(type));
        }
        depth -= 1;
        return type;
    }
    
    function reconcile_list(types) {
        var type = null;
        for(var i in types){
            type = reconcile(type, types[i]);
        }
        return type;
    }
    
    return reconcile_list(values);
}