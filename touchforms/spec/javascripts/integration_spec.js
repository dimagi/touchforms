describe('Integration', function() {
    var questionJSON,
        formJSON,
        repeatJSON,
        repeatNestJSON;

    beforeEach(function() {
        questionJSONMulti = {
            "caption_audio": null,
            "caption": "Do you want to modify the visit number?",
            "binding": "/data/start/update_visit_count",
            "caption_image": null,
            "type": "question",
            "caption_markdown": null,
            "required": 0,
            "ix": "0",
            "relevant": 1,
            "help": null,
            "answer": null,
            "datatype": Formplayer.Const.MULTI_SELECT,
            "style": {},
            "caption_video": null,
            "choices": [
                "Yes",
                "No"
            ]
        };
        questionJSONString = {
            "caption_audio": null,
            "caption": "Do you want to modify the visit number?",
            "binding": "/data/start/update_visit_count",
            "caption_image": null,
            "type": "question",
            "caption_markdown": null,
            "required": 0,
            "ix": "1",
            "relevant": 1,
            "help": null,
            "answer": null,
            "datatype": Formplayer.Const.STRING,
            "style": {},
            "caption_video": null,
        };
        formJSON = {
            tree: [questionJSONMulti, questionJSONString],
            seq_id: 1,
            session_id: '123',
            title: 'My title',
            langs: ['en']
        };
        this.clock = sinon.useFakeTimers();
    });

    afterEach(function() {
        $.unsubscribe();
        this.clock.restore();
    });


    it('Should reconcile questions answered at the same time for strings', function() {
        var self = this;
        var questionJSONString2 = {};
        $.extend(questionJSONString2, questionJSONString);
        questionJSONString.ix = '0';
        questionJSONString2.ix = '1';
        formJSON.tree = [questionJSONString, questionJSONString2];
        var form = new Form(_.clone(formJSON));

        var stringQ1 = form.children()[0];
        var stringQ2 = form.children()[1];

        var response1 = {};
        $.extend(response1, formJSON);
        response1.tree[0].answer = 'ben'
        response1.tree[1].answer = null

        var response2 = {};
        $.extend(response2, formJSON);
        response2.tree[0].answer = 'ben'
        response2.tree[1].answer = 'lisa'


        // Fire off a change in the string question
        stringQ1.entry.answer('ben');
        this.clock.tick(stringQ1.throttle);

        // once we receive signal to answer question, pending answer should be set
        expect(stringQ1.pendingAnswer).toBe('ben');

        // Fire off a change in the other question before we've reconciled first one
        stringQ2.entry.answer('lisa');
        expect(stringQ2.pendingAnswer).toBe('lisa');

        // Have server respond to the string question before string changes
        // this would normally fire off another change to multi, but we do not reconcile
        // questions that have pending answers.
        $.publish('adapter.reconcile', [response1, stringQ1]);
        expect(stringQ2.pendingAnswer).toBe('lisa');
        expect(stringQ2.answer()).toBe('lisa');
        expect(stringQ1.pendingAnswer).toBe(null);
        expect(stringQ1.answer()).toBe('ben');


        $.publish('adapter.reconcile', [response2, stringQ2]);
        expect(stringQ1.answer()).toBe('ben');
        expect(stringQ2.answer()).toBe('lisa');
        expect(stringQ1.pendingAnswer).toBe(null);
        expect(stringQ2.pendingAnswer).toBe(null);
    });

    it('Should reconcile questions answered at the same time for multi', function() {
        var form = new Form(_.clone(formJSON));
        var multiQ = form.children()[0];
        var stringQ = form.children()[1];

        var response1 = {};
        $.extend(response1, formJSON);
        response1.tree[0].answer = null;
        response1.tree[1].answer = 'ben';

        var response2 = {};
        $.extend(response2, formJSON);
        response2.tree[0].answer = [1];
        response2.tree[1].answer = 'ben';

        // Fire off a change in the string question
        stringQ.entry.answer('ben');
        this.clock.tick(stringQ.throttle);
        expect(stringQ.pendingAnswer).toBe('ben');

        // Fire off a change in the multi question
        multiQ.entry.answer(["1"]);
        expect(multiQ.pendingAnswer).toEqual(["1"]);

        // Have server respond to the string question before multi changes
        // this would normally fire off another change to multi, but we do not reconcile
        // questions that have pending answers.
        $.publish('adapter.reconcile', [response1, stringQ]);
        expect(stringQ.pendingAnswer).toBe(null);
        expect(stringQ.answer()).toBe('ben');
        expect(multiQ.pendingAnswer).toEqual(["1"]);
        expect(multiQ.answer()).toEqual(["1"]);

        $.publish('adapter.reconcile', [response2, multiQ]);
        expect(stringQ.answer()).toBe('ben');
        expect(multiQ.answer()).toEqual(["1"]);
        expect(stringQ.pendingAnswer).toBe(null);
        expect(multiQ.pendingAnswer).toBe(null);
    });

});

