describe('Test the formplayer', function() {
    describe('Entrycontrols', function() {

        var questionJSON,
            formSpec,
            formJSON,
            sessionData,
            repeatJSON,
            adapter = sinon.spy();

        beforeEach(function() {
            affix('#form);
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

            adapter = new xformAjaxAdapter(
                formSpec,
                sessionData,
                null,
                sinon.spy(),
                sinon.spy(),
                sinon.spy(),
                {}
            );
        });
        afterEach(function() {
            $('#form').remove();
        });

        it('Should render a select question', function() {
            var form = init_render(formJSON, adapter, $('#form'));

            expect($('#form').find('.sel').length).toBe(questionJSON.choices.length);

            $('#form').find('#ch-0').trigger('click');
            expect($('#form').find('.sel input:checked').length).toBe(1);

            $('#form').find('#clear').click();
            expect($('#form').find('.sel input:checked').length).toBe(0);
        });

        it('Should render a repeater question', function() {
            var form = init_render(formJSON, adapter, $('#form'));

            sinon.stub(adapter, 'newRepeat');

            expect($('#form').find('.rep').length).toBe(1);

            expect(adapter.newRepeat.calledOnce).toBe(false);
            $('#form .rep').find('.add').trigger('click');
            expect(adapter.newRepeat.calledOnce).toBe(true);
        });
    });
});
