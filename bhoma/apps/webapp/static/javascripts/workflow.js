/*
 * Common workflow methods/widgets go here.
 */ 

function qSelectReqd (caption, choices) {
  return new wfQuestion(caption, 'select', null, choices, true);
}

function get_usernames() {
    res = jQuery.ajax({url: '/api/usernames/', 
                              type: 'GET', 
                              async: false,
                              success: function(data, textStatus, request) {
                                    json_res = JSON.parse(data);
                                    request.result = json_res;
                                },
                       });
    return res.result;
}
        
function qUsernameList(title) {
    usernames = get_usernames();
    if (title == null) 
        title = "Please select your username";
    return qSelectReqd(title, usernames);
}