import urllib2
import json
import random
import math
from datetime import date, timedelta
import time
import threading

server_url = '127.0.0.1:4444'
concurrent_sessions = 100
form = 'asdfasdfasdf.xml'

#how often to click the 'back' button
BACK_FREQ = .05

#how often to answer with blank
BLANK_FREQ = .1

#how often to give a knowingly out-of-range answer (for
#most questions we don't know the allowed range)
OUT_OF_RANGE_FREQ = .1

#relative frequencies of repeat actions
REPEAT_FREQ = {
    'edit': .2,
    'delete': .1,
    'done': .1,
    'add': .6,
}

MIN_DELAY = .01 #s
VALIDATION_BACKOFF = .25

def request(server, payload):
    conn = urllib2.urlopen('http://' + server, json.dumps(payload))
    return json.loads(conn.read())

def monkey_loop(form_id):
    def r(resp):
        if resp.get('event'):
            return (resp, resp['event'], resp['event']['type'])
        else:
            return (resp, evt, evt_type)

    resp, evt, evt_type = r((yield ('new-form', {'form-name': form_id})))

    while evt_type != 'form-complete':
        if random.random() < BACK_FREQ:
            resp, evt, evt_type = r((yield ('back', {})))

        if evt_type == 'question':
            answer = random_answer(evt['datatype'], len(evt['choices']) if evt.get('choices') else None)
            resp, evt, evt_type = r((yield ('answer', {'answer': answer})))
        elif evt_type == 'repeat-juncture':
            resp, evt, evt_type = r((yield repeat_juncture(evt)))

def random_answer(datatype, num_choices):
    if random.random() < BLANK_FREQ:
        return None

    # not used yet
    in_range = (random.random() > OUT_OF_RANGE_FREQ)

    if datatype == 'int':
        return random.randint(0, 100)
    elif datatype == 'float':
        return round(100 * random.random(), random.randint(0, 4))
    elif datatype == 'str':
        numeric = (random.random() < .2)
        alphabet = '0123456789' if numeric else 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ        '
        return ''.join(random.choice(alphabet) for i in range(random.randint(3, 12)))
    elif datatype == 'date':
        # before, after
        future = (random.random() < .1)
        params = (25500, 60) if not future else (-1000, 10)
        return rand_date(*params).strftime('%Y-%m-%d')
    elif datatype == 'time':
        return '%02d:%02d' % (random.randint(0, 23), random.randint(0, 59))
    elif datatype == 'select':
        return random.randint(1, num_choices)
    elif datatype == 'multiselect':
        # as-select1
        return random.sample(xrange(1, num_choices + 1), random.randint(0, num_choices))

def rand_date(max_range, max_rel_likelihood):
    exp_max = math.log(max_rel_likelihood)
    resolution = (max_rel_likelihood - 1.) / abs(max_range)
    k = random.randint(0, int((exp_max - 1.) / resolution))
    days_diff = (math.exp(k * resolution + 1.) - 1.) / (max_rel_likelihood - 1.) * -max_range
    return date.today() + timedelta(days=days_diff)

def choose_weighted(choices):
    total = sum(ch[1] for ch in choices)
    r = random.random() * total
    for choice, weight in choices:
        if r < weight:
            return choice
        else:
            r -= weight

def repeat_juncture(evt):
    actions = REPEAT_FREQ.copy()
    num_reps = len(evt['repetitions'])

    if not evt['add-choice']:
        del actions['add']
    if not evt['del-choice'] or num_reps == 0:
        del actions['delete']
    if num_reps == 0:
        del actions['edit']

    action = choose_weighted(actions.items())
    if action == 'done':
        return ('next', {})
    elif action == 'add':
        return ('new-repeat', {})
    elif action == 'edit':
        return ('edit-repeat', {'ix': random.randint(1, num_reps)})
    elif action == 'delete':
        return ('delete-repeat', {'ix': random.randint(1, num_reps)})

def run_monkey(g, avg_delay):
    session_id = None

    def mk_payload(action, args):
        payload = args.copy()
        payload['action'] = action
        if session_id:
            payload['session-id'] = session_id
        return payload

    try:
        resp = None
        req = None
        validation_fail_count = 0
        while True:
            action, args = (g.send(resp) if req is None else req)
            print '<< %s %s' % (action, str(args))
            resp = request(server_url, mk_payload(action, args))
            print '>> %s' % str(resp)

            if not session_id:
                session_id = resp['session_id']

            #handle form nav steps that are completely non-interactive
            req = None
            if resp.get('event') and resp['event']['type'] == 'sub-group':
                req = ('next', {})

            #keep track of how many times the validation has failed, and speed
            #things up if so
            if resp.get('status') and resp['status'] != 'accepted':
                validation_fail_count += 1
            else:
                validation_fail_count = 0

            delay = calc_delay(avg_delay)
            #this doesn't work as planned because the 'back' action resets the counter
            delay *= math.exp(-validation_fail_count * VALIDATION_BACKOFF)
            sleep(delay)

    except StopIteration:
        pass

def calc_delay(avg_delay, std_dev=None):
    if std_dev == None:
        std_dev = .4 * avg_delay
    return max(random.normalvariate(avg_delay, std_dev), 0.)

clock = 0
def sleep(delay):
    global clock
    clock += delay
    if clock > MIN_DELAY:
        sleep_for = clock - clock % MIN_DELAY
        time.sleep(sleep_for)
        clock -= sleep_for

class runner(threading.Thread):
    def __init__(self, form_id, delay, delay_start=False):
        threading.Thread.__init__(self)
        self.form_id = form_id
        self.delay = delay
        self.delay_start = delay_start

    def run(self):
        if self.delay_start:
            sleep(random.random() * 2. * self.delay)

        run_monkey(monkey_loop(self.form_id), self.delay)


THREAD_MAX = 5

threads = []
while True:
    threads = [th for th in threads if th.is_alive()]
    while len(threads) < THREAD_MAX:
        th = runner('/home/drew/dev/bhoma/bhoma/xforms/bhoma_general.xhtml', 1., True)
        threads.append(th)
        th.start()
    time.sleep(.01)
