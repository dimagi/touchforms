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

from django.core.cache import cache
import os.path

DATASET = 'us'
#DATASET = 'zam'

def load_census_file(path):
    with open(path) as f:
        lines = f.readlines()
        for ln in lines:
            name = ln[:15].strip()
            prob = float(ln[15:20]) / 100.
            yield {'name': name, 'p': max(2e5 * prob, 1.)}

def load_raw_file(path):
    with open(path) as f:
        lines = f.readlines()
        for ln in lines:
            pcs = ln.split(';')
            name = pcs[0].strip()
            prob = int(pcs[1].strip())
            yield {'name': name, 'p': prob}

def get_matches(data, key, maxnum, matchfunc=None):
    if matchfunc == None:
        matchfunc = lambda key, name: name.startswith(key)

    #autocomplete suggestions
    matches = []
    for d in data:
        if matchfunc(key, d['name']):
            matches.append(d)
            if len(matches) == maxnum:
                break

    #next-char statistics for keyboard hinting
    alpha = {}
    total = 0
    for d in data:
        if d['name'].startswith(key) and not d['name'] == key:
            c = d['name'][len(key)]
            if c not in alpha:
                alpha[c] = 0
            alpha[c] += d['p']
            total += d['p']

    print sorted(list(alpha.iteritems()))

    return {'suggestions': matches, 'hinting': {'nextchar_freq': alpha, 'sample_size': total}}

def autocomplete(request):
    domain = request.GET.get('domain')
    key = request.GET.get('key', '')
    max_results = int(request.GET.get('max', '20'))

    if domain != 'firstname':
        response = get_suggestions(domain, key, max_results)
    else:
        resp_m = get_suggestions('firstname-male', key, max_results)
        resp_f = get_suggestions('firstname-female', key, max_results)
        response = {}
        response['suggestions'] = []
        response['suggestions'].extend(resp_m['suggestions'])
        response['suggestions'].extend(resp_f['suggestions'])
        response['suggestions'].sort(key=lambda m: -m['p'])
        response['suggestions'] = response['suggestions'][:max_results]
        response['hinting'] = resp_m['hinting']
        response['hinting']['sample_size'] += resp_f['hinting']['sample_size']
        for c, k in resp_f['hinting']['nextchar_freq'].iteritems():
            if c not in response['hinting']['nextchar_freq']:
                response['hinting']['nextchar_freq'][c] = 0
            response['hinting']['nextchar_freq'][c] += k

    return HttpResponse(json.dumps(response), 'text/json')

def get_suggestions(domain, key, maxnum):
    if not cacheget((domain, 'initialized')):
        init_cache(domain)

    response = cacheget((domain, 'results', key))
    if not response:
        print 'no response cached', (domain, 'results', key)
        rawdata = None
        lookup_key = key
        while rawdata == None and len(lookup_key) > 0:
            rawdata = cacheget((domain, 'raw', lookup_key))
            lookup_key = lookup_key[:-1]
        if rawdata == None:
            #prefix for which no matches exist
            rawdata = []
        response = get_response(domain, key, rawdata)
    response['suggestions'] = response['suggestions'][:maxnum]
    return response

def group(it, func):
    grouped = {}
    for e in it:
        key = func(e)
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(e)
    return grouped

def init_cache(domain):
    IX_LEN = 3

    data = load_data(domain)
    for i in range(IX_LEN + 1):
        subdata = group(data, lambda e: e['name'][:i])
        for key, records in subdata.iteritems():
            if len(key) != i:
                continue
            print i, key
            cacheset((domain, 'results', key), get_matches(records, key, 20))
            if i == IX_LEN:
                cacheset((domain, 'raw', key), records)
    cacheset((domain, 'initialized'), True)

def get_response(domain, key, data):
    response = get_matches(data, key, 20)
    cacheset((domain, 'results', key), response)
    return response

def load_data(domain):
    rootdir = 'data/census'

    if domain == 'village':
        if DATASET == 'zam':
            path = 'zamvillage'
        else:
            path = 'usplaces'
        data = load_raw_file(os.path.join(rootdir, path))
    else:
        if DATASET == 'zam':
            path = {
                'firstname-male': 'zamnamesfirstmale',
                'firstname-female': 'zamnamesfirstfemale',
                'lastname': 'zamnameslast'
                }[domain]
            loadfunc = load_raw_file
        else:
            path = {
                'firstname-male': 'dist.male.first',
                'firstname-female': 'dist.female.first',
                'lastname': 'dist.all.last'
                }[domain]
            loadfunc = load_census_file
        data = loadfunc(os.path.join(rootdir, path))
    data = list(data)
    data.sort(key=lambda v: -v['p'])
    return data

import base64

def enc(data):
    return base64.b64encode(json.dumps(data))

def dec(data):
    return json.loads(base64.b64decode(data))

def cacheget(key):
    data = cache.get(enc(key))
    if data == None:
        return None
    else:
        return dec(data)

def cacheset(key, val):
    cache.set(enc(key), enc(val), 3600)
