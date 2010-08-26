
function wfDeleteUser() {
    /*
        Delete a user
     */
    var flow = function (data) {
        var q_username = qUsernameList("Please select the user to delete.");
        yield q_username;
        data["username"] = usernames[q_username.value - 1];
        
        var q_confirm = qSelectReqd('About to delete ' + data["username"] + '. Are you sure? You cannot undo this!', 
                                      ['Yes, delete user: ' + data["username"], 'No']);
        yield q_confirm;
        data["confirm"] = (q_confirm.value == 1);
    
  }

  var onFinish = function (data) {
    submit_redirect({result: JSON.stringify(data)});
  }

  return new Workflow(flow, onFinish);
}
