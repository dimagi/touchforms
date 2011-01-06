from django.http import HttpResponseRedirect, HttpResponse
import json
from django.views.decorators.http import require_POST
from django.contrib.auth.models import check_password, User, Group
from bhoma.apps.profile.models import BhomaUserProfile
import bhoma.apps.webapp.diagnostics as d
from bhoma.apps.webapp.models import Ping

def get_usernames(request):
    """
    Gets a list of usernames for the login workflow
    """
    users = BhomaUserProfile.objects.filter(is_web_user=True).values_list('user__username', flat=True).order_by('user__username')
    # json doesn't like unicode markups
    users = [str(usr) for usr in users]
    return HttpResponse(json.dumps(users))
    

@require_POST
def authenticate_user(request):
    """
    Perform django authentication on a user/password
    """
    username = request.POST["username"]
    password = request.POST["password"]
    user = User.objects.get(username=username)
    # HACK: try to authenticate first with the normal password, then with the lowercase password
    success = check_password(password, user.password) or check_password(password.lower(), user.password)
    return HttpResponse(json.dumps({"result": success}))
    
def user_exists(request):
    """
    Gets a list of usernames for the login workflow
    """
    username = request.POST["username"]
    exists = User.objects.filter(username__iexact=username).exists()
    return HttpResponse(json.dumps({"result": exists}))

def get_roles(request):
    # it makes more sense to call these roles but in django they're groups
    return HttpResponse(json.dumps([str(grp) for grp in Group.objects.all().values_list("name", flat=True).order_by("name")]))
    
def diagnostics(req):
    """run some diagnostics, output the results in JSON"""
    errors = []
    if d.couch_is_down():
        errors.append("couch is down!")
    if d.database_is_down():
        errors.append("database is down!")
    
    return HttpResponse(json.dumps({'errors': errors}))

def phone_home(request, tag):
    ping = Ping()
    ping.tag = tag
    ping.ip = request.META['REMOTE_ADDR']
    if request.method == 'POST' and request.raw_post_data:
        ping.payload = request.raw_post_data
    ping.save()
    return HttpResponse('ping', mimetype='text/plain')







#TEMPORARY
def lookup_names(domain, key, maxnum):
    def load_names(path):
        with open(path) as f:
            lines = f.readlines()
            for ln in lines:
                name = ln[:15].strip()
                prob = float(ln[15:20]) / 100.
                yield {'name': name, 'p': prob}

    path = '/home/drew/tmp/census/' + {
        'firstname-male': 'dist.male.first',
        'firstname-female': 'dist.female.first',
        'lastname': 'dist.all.last'
        }[domain]

    matches = []
    for k in load_names(path):
        if k['name'].startswith(key):
            matches.append(k)
            if len(matches) == maxnum:
                break
    return matches

def autocomplete(request):
    domain = request.GET.get('domain')
    key = request.GET.get('key', '')
    max_results = int(request.GET.get('max', '20'))

    if domain == 'village':
        matches = match_village(domain, key, max_results)
    elif domain == 'firstname':
        matchesm = lookup_names('firstname-male', key, max_results)
        matchesf = lookup_names('firstname-female', key, max_results)
        matches = []
        matches.extend(matchesm)
        matches.extend(matchesf)
        matches.sort(key=lambda m: -m['p'])
        matches = matches[:max_results]
    else:
        matches = lookup_names(domain, key, max_results)

    return HttpResponse(json.dumps(matches), 'text/json')

def match_village(domain, key, maxnum):
    def load_villages(path):
        with open(path) as f:
            lines = f.readlines()
            for ln in lines:
                pcs = ln.split(';')
                name = pcs[0].strip()
                prob = int(pcs[1].strip())
                yield {'name': name, 'p': prob}

    path = '/home/drew/tmp/census/usplaces'
#    path = '/home/drew/tmp/census/zamvillage'

    villages = list(load_villages(path))
#    villages.sort(key=lambda v: -v['p'])

    matches = []
    for v in villages:
        if village_match(key, v['name']):
            matches.append(v)
            if len(matches) == maxnum:
                break
    return matches

def village_match(key, village):
    return village.startswith(key)

