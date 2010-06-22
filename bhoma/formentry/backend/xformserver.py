import sys
from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler
from SocketServer import ThreadingMixIn
import threading
import logging
import jsonhack as json  #todo: replace with real json library
import xformplayer
import os

logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)

BHOMA_BASE = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    pass

class XFormHTTPGateway(threading.Thread):
    def __init__(self, port):
        threading.Thread.__init__(self)
        self.server = ThreadingHTTPServer(('', port), XFormRequestHandler)

    def run(self):
        self.server.serve_forever()

    def terminate(self):
        self.server.shutdown()

class XFormRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        #this is a hack - due to cross-site request limitations, the static webpage
        #and the ajax requests need to use the same server
        #ideally, the client should communicate only with a real web server, which
        #serves the pages, and proxies the ajax requests to here
        try:
            WWW_ROOT = BHOMA_BASE + 'formentry\\client\\'
            requestpath = self.path.split('?')[0]
            filepath = WWW_ROOT + '\\'.join(requestpath.split('/'))
            content = open(filepath, 'rb').read()

            self.send_response(200)
            self.send_header('Content-Length', str(len(content)))
            if requestpath.endswith('.png'):
                self.send_header('Content-Type', 'image/png')
            self.end_headers()
            self.wfile.write(content)
        except IOError:
            self.send_error(404)

    def do_POST(self):
        if 'content-length' in self.headers.dict:
            length = int(self.headers.dict['content-length'])
        else:
            logging.warn('content length required')
            self.send_error(400, 'content length required for post')
            return

        if 'content-type' not in self.headers.dict or self.headers.dict['content-type'] != 'text/json':
            logging.warn('content type missing or non-json')

        body = self.rfile.read(length)
        try:
            logging.debug('received: [%s]' % body)
            data_in = json.loads(body)
        except:
            logging.warn('content does not parse')
            self.send_error(400, 'content does not parse as valid json')
            return

        try:
            data_out = handle_request(data_in)
        except Exception, e:
            logging.exception('error handling request')
            self.send_error(500, 'internal error handling request: %s: %s' % (type(e), str(e)))
            return

        reply = json.dumps(data_out)

        self.send_response(200)
        self.send_header('Content-Type', 'text/json')
        self.end_headers()
        self.wfile.write(reply)
        logging.debug('returned: [%s]' % reply)

def handle_request (content):
    if 'action' not in content:
        return {'error': 'action required'}

    action = content['action']
    if action == 'new-form':
        if 'form-id' not in content:
            return {'error': 'form identifier required'}

        return xformplayer.open_form(content['form-id'])

    elif action == 'edit-form':
        return {'error': 'unsupported'}

    elif action == 'answer':
        if 'session-id' not in content:
            return {'error': 'session id required'}
        if 'answer' not in content:
            return {'error': 'answer required'}

        return xformplayer.answer_question(content['session-id'], content['answer'])

    elif action == 'next':
        if 'session-id' not in content:
            return {'error': 'session id required'}

        return xformplayer.skip_next(content['session-id'])

    elif action == 'back':
        if 'session-id' not in content:
            return {'error': 'session id required'}

        return xformplayer.go_back(content['session-id'])

    else:
        return {'error': 'unrecognized action'}



if __name__ == "__main__":

    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    else:
        port = 444

    gw = XFormHTTPGateway(port)
    gw.start()
    logging.info('started server on port %d' % port)

    try:
        while True:
            pass
    except KeyboardInterrupt:
        logging.info('interrupted; shutting down...')
        gw.terminate()
