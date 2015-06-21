describe('Fullform UI', function() {
    var questionJSON,
        formSpec,
        formJSON,
        sessionData,
        repeatJSON;

    beforeEach(function() {
        formSpec = {
            "type": "url",
            "val": "http://dummy/dummy.xml"
        };
        questionJSON = {
            "caption_audio": null,
            "caption": "Do you want to modify the visit number?",
            "binding": "/data/start/update_visit_count",
            "caption_image": null,
            "type": "question",
            "caption_markdown": null,
            "required": 0,
            "ix": "1,2",
            "relevant": 1,
            "help": null,
            "answer": null,
            "datatype": "select",
            "style": {},
            "caption_video": null,
            "choices": [
                "Yes",
                "No"
            ]
        };

        repeatJSON = {
            "caption_audio": null,
            "caption": "Repeater",
            "caption_image": null,
            "type": "repeat-juncture",
            "caption_markdown": null,
            "ix": "4J",
            "relevant": 1,
            "main-header": "Repeater",
            "children": [],
            "add-choice": "None - Add Repeater",
            "caption_video": null
        };

        formJSON = {
            tree: [questionJSON, repeatJSON],
            seq_id: 1,
            session_id: '123',
            title: 'My title',
            langs: ['en']
        };

        sessionData = {
            "username": "ben",
            "additional_filters": {
                "footprint": true
            },
            "domain": "mydomain",
            "user_id": "123",
            "user_data": {},
            "app_id": "456",
            "session_name": "SUCCEED CM app > CM4 - Clinic Visit - Benjamin",
            "app_version": "2.0",
            "device_id": "cloudcare",
            "host": "http://dummy"
        };

    });

    it('Should render a basic form and reconcile', function() {
        var form = new Form(formJSON),
            newJson = [questionJSON];

        expect(form.children().length).toBe(2);

        form.reconcile(newJson);
        expect(form.children().length).toBe(1);
    });

    it('Should render a repeater question', function() {
        var repeatChild = {
            "caption": "Repeater 1/2",
            "type": "sub-group",
            "uuid": "77ff006407f5",
            "ix": "0:0",
            "children": [{
                "caption_audio": null,
                "caption": "Single Answer",
                "binding": "/data/repeat/single_answer",
                "caption_image": null,
                "type": "question",
                "caption_markdown": null,
                "required": 0,
                "ix": "0:0,0",
                "relevant": 1,
                "help": null,
                "answer": null,
                "datatype": "select",
                "style": {},
                "caption_video": null,
                "choices": [
                 "item1",
                 "item2"
                ]
            }],
            "repeatable": 1
        }

        formJSON.tree = [repeatJSON];
        var form = new Form(formJSON);
        expect(form.children().length).toBe(1);
        //expect(form.children()[0].length).toBe(0);

        // Add new repeat
        repeatJSON.children = [repeatChild]
        formJSON.tree = [repeatJSON];
        form.reconcile(formJSON.tree)
        expect(form.children().length).toBe(1);
        // Each repeat is a group with questions
        expect(form.children()[0].type()).toBe(Formplayer.Const.REPEAT_TYPE);
        //expect(form.children()[0].isRepeat).toBe(true);
        expect(form.children()[0].children().length).toBe(1);
        expect(form.children()[0].children()[0].type()).toBe(Formplayer.Const.GROUP_TYPE);
        //expect(form.children()[0].children()[0].isRepetition).toBe(true);
        expect(form.children()[0].children()[0].children()[0].type())
            .toBe(Formplayer.Const.QUESTION_TYPE);
    });

    it('Should reconcile question choices', function() {
        formJSON.tree = [questionJSON];
        var form = new Form(formJSON),
            question = form.children()[0];
        expect(form.children().length).toBe(1);
        expect(question.choices().length).toBe(2);

        questionJSON.choices = ['A new choice'];
        formJSON.tree = [questionJSON]
        form.reconcile(formJSON.tree);
        expect(form.children().length).toBe(1);
        expect(question.choices().length).toBe(1);
    });
});
