/*
 * Common workflow methods/widgets go here.
 */ 

function qSelectReqd (caption, choices, help) {
  return new wfQuestion(caption, 'select', null, uniqifyChoices(choices), true, null, help);
}

function uniqifyChoices (choices) {
  var duplicateChoices = true;
  while (duplicateChoices) {
    captions = []
    indices = []
    for (var i = 0; i < choices.length; i++) {
      var k = captions.indexOf(choices[i]);
      if (k == -1) {
        k = captions.length;
        captions.push(choices[i]);
        indices[k] = []
      }
      indices[k].push(i);
    }

    duplicateChoices = false;
    for (var i = 0; i < indices.length; i++) {
      if (indices[i].length > 1) {
        duplicateChoices = true;
        for (var j = 0; j < indices[i].length; j++) {
          choices[indices[i][j]] += ' (' + (j + 1) + ')'
        }
      }
    }
  }

  return choices;
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