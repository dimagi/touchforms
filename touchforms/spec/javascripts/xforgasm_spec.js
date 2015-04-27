describe('Test xforgasm.js', function() {

    describe('TaskQueue', function() {
        var tq,
            taskOne,
            taskTwo;
        beforeEach(function() {
            tq = new TaskQueue();
            taskOne = sinon.spy();
            taskTwo = sinon.spy();
            tq.addTask('one', taskOne, [1,2,3])
            tq.addTask('two', taskTwo, [5,6,7])
        });

        it('Executes tasks in order', function() {
            tq.execute()
            expect(taskOne.calledOnce).toBe(true);
            expect(taskOne.calledWith(1, 2, 3)).toBe(true);
            expect(taskTwo.calledOnce).toBe(false);

            tq.execute()
            expect(taskTwo.calledOnce).toBe(true);
            expect(taskTwo.calledWith(5, 6, 7)).toBe(true);
            expect(tq.queue.length).toBe(0);

            tq.execute() // ensure no hard failure when no tasks in queue
        })

        it('Executes tasks by name', function() {
            tq.execute('two');
            expect(taskOne.calledOnce).toBe(false);
            expect(taskTwo.calledOnce).toBe(true);
            expect(tq.queue.length).toBe(1);

            tq.execute('cannot find me');
            expect(tq.queue.length).toBe(1);

            tq.execute()
            tq.execute()
        });

        it('Clears tasks by name', function() {
            tq.addTask('two', taskTwo, [5,6,7]);
            expect(tq.queue.length).toBe(3);

            tq.clearTasks('two');
            expect(tq.queue.length).toBe(1);

            tq.clearTasks();
            expect(tq.queue.length).toBe(0);
        });
    });

    describe('WebFormSession', function() {
        var server,
            params;

        beforeEach(function() {
            // Setup HTML
            affix('input#submit');
            affix('#content');

            // Setup Params object
            params = {
                form_url: window.location.host,
                onerror: sinon.spy(),
                onload: sinon.spy(),
                onsubmit: sinon.spy(),
                resourceMap: sinon.spy(),
                session_data: {},
                xform_url: 'http://xform.url/'
            };

            // Setup fake server
            server = sinon.fakeServer.create();
            server.respondWith(
                params.xform_url,
                [200,
                { 'Content-Type': 'application/json' },
                '{ "status": "success" }']);

            // Setup server constants
            window.XFORM_URL = 'dummy'

            // Setup stubs
            $.cookie = sinon.stub()
        });
        afterEach(function() {
            $('#submit').remove();
            server.restore();
        })

        it('Test request queuing', function() {
            sess = new WebFormSession(params);
            sess.load($('#content'), 'en')
            sess.serverRequest({}, sinon.spy(), false);

            sinon.spy(sess.taskQueue, 'execute');

            expect(!!$('input#submit').attr('disabled')).toBe(false);
            expect(sess.taskQueue.execute.calledOnce).toBe(false);
            server.respond();
            expect(!!$('input#submit').attr('disabled')).toBe(false);
            expect(sess.taskQueue.execute.calledOnce).toBe(true);
        });
    });
});
