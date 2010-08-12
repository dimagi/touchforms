
function wfNewUser() {
    /*
     * Create a new user
     */
    var flow = function (data) {
        
        var user_exists = function(username) {
            fail_text = "Sorry, the username " + username + " is already taken. Please try a different username.";
            error_text = "Sorry, something went wrong. I this keeps happening please contact CIDRZ.  Your message is: ";        
            result = jQuery.ajax({url: '/api/user_exists/', 
					              type: 'POST', 
					              data: {'username': username}, 
					              async: false,
					              success: function(data, textStatus, request) {
	                                    json_res = JSON.parse(data);
                                        if (json_res["result"]) {
					                        request.result = fail_text;
					                    } else {
					                        request.result = null;
					                    }
					                },
					              error: function(request, textStatus, errorThrown) {
					                request.result = error_text + textStatus + " " + errorThrown;
					              }
	                   });
            return result.result;
        };
        
        var userval = function (username) {
            re = new RegExp("^[A-Za-z0-9]+$");
            match = re.exec(username);
            if (match == null) {
                return "User names cannot contain punctuation or spaces";
            } else {
                return user_exists(username);
            }
        }

        var q_username = new wfQuestion('Login Name', 'str', null, null, true, userval, null, 'alpha');
        yield q_username;
        data['username'] = q_username.value;



        
        var password_format = function (pass) {
            return (pass.length < 5 ? "Passwords must be at least 5 digits" : null);
        };
        var q_password = new wfQuestion('Password', 'str', null, null, true, password_format, null, 'numeric');
        yield q_password;
        data['password'] = q_password.value;
        
        var q_fname = new wfQuestion('First Name', 'str', null, null, true, null, null, 'alpha');
	    yield q_fname;
	    data['fname'] = q_fname.value;
    	
      var q_lname = new wfQuestion('Last Name', 'str', null, null, true, null, null, 'alpha');
	    yield q_lname;
	    data['lname'] = q_lname.value;
  }

  var onFinish = function (data) {
    submit_redirect(data);
  }

  return new Workflow(flow, onFinish);
}
