from django.http import HttpResponseRedirect, HttpResponse
import json
from django.views.decorators.http import require_POST
from django.core.urlresolvers import reverse
from django.contrib.auth.models import check_password, User

def get_usernames(request):
    pass
    #return HttpResponse.

@require_POST
def authenticate_user(request):
    """
    Perform django authentication on a user/password
    """
    username = request.POST["username"]
    password = request.POST["password"]
    user = User.objects.get(username=username)
    return HttpResponse(json.dumps({"result": check_password(password, user.password)}))
    
