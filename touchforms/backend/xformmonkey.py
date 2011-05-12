import urllib2
import json
import random
import math
from datetime import date, timedelta
import time

server_url = '127.0.0.1:4444'
concurrent_sessions = 100
form = 'asdfasdfasdf.xml'

BACK_FREQ = .1
BLANK_FREQ = .1
OUT_OF_RANGE_FREQ = .1

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
            resp, evt, evt_type = r((yield repeat_juncture()))

def random_answer(datatype, num_choices):
    if random.random() < BLANK_FREQ:
        return None

    # not used yet
    in_range = (random.random() > OUT_OF_RANGE_FREQ)

    if datatype == 'int':
        return random.randint(0, 30)
    elif datatype == 'float':
        return round(30 * random.random(), random.randint(0, 4))
    elif datatype == 'str':
        return ''.join(random.choice('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ        ') for i in range(random.randint(3, 12)))
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
            delay *= math.exp(-validation_fail_count * VALIDATION_BACKOFF)
            sleep(delay)

            if not session_id:
                session_id = resp['session_id']
    except StopIteration:
        pass

def calc_delay(avg_delay, std_dev=None):
    if std_dev == None:
        std_dev = .4 * avg_delay
    return max(random.normalvariate(avg_delay, std_dev), 1.)

clock = 0
def sleep(delay):
    global clock
    clock += delay
    if clock > MIN_DELAY:
        sleep_for = clock - clock % MIN_DELAY
        time.sleep(sleep_for)
        clock -= sleep_for

run_monkey(monkey_loop('/home/drew/dev/bhoma/bhoma/submodules/touchforms/touchforms/data/xforms/tmpWHuqy6'), 0.)

#while True:
    

#    resp = request(server_url, mk_payload(action, args))


#generator consumer handles server communication
  #action, args

"""
    if (event["type"] == "question") {

      renderQuestion(event, dirForward);
    } else if (event["type"] == "form-complete") {

    } else if (event["type"] == "sub-group") {

    } else if (event["type"] == "repeat-juncture") {
        options.push({lab: event["repetitions"][i], val: 'rep' + (i + 1)});
      }

        if (event["add-choice"] != null) {
          options.push({lab: event["add-choice"], val: 'add'});
        }
        if (event["del-choice"] != null) {
          options.push({lab: event["del-choice"], val: 'del'});
        }
        options.push({lab: event["done-choice"], val: 'done'});
      } else {
        event["caption"] = event["del-header"];
      }
"""
