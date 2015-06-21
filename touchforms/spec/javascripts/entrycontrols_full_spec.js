describe('Entries', function() {
    var questionJSON,
        spy;


    beforeEach(function() {
        questionJSON = {
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
            "datatype": "int",
            "style": {},
            "caption_video": null,
        }
        spy = sinon.spy()
        $.subscribe('formplayer.answer-question', spy);
    });

    it('Should return the IntEntry', function() {
        entry = (new Question(questionJSON)).entry
        expect(entry instanceof IntEntry).toBe(true);
        expect(entry.templateType).toBe('int')

        entry.answer(1234);
        valid = entry.prevalidate()
        expect(valid).toBe(true);
        expect(spy.calledOnce).toBe(true);

        entry.answer('abc');
        valid = entry.prevalidate()
        expect(valid).toBe(false);
        expect(spy.calledOnce).toBe(true);
    });

    it('Should return FloatEntry', function() {
        questionJSON.datatype = Formplayer.Const.FLOAT;
        entry = (new Question(questionJSON)).entry
        expect(entry instanceof FloatEntry).toBe(true);
        expect(entry.templateType).toBe('float')

        entry.answer(2.3);
        valid = entry.prevalidate()
        expect(valid).toBe(true);
        expect(spy.calledOnce).toBe(true);

        entry.answer('2.4');
        valid = entry.prevalidate()
        expect(valid).toBe(true);
        expect(spy.calledTwice).toBe(true);

        entry.answer('mouse');
        valid = entry.prevalidate()
        expect(valid).toBe(false);
        expect(spy.calledTwice).toBe(true);
    })

    it('Should return FreeTextEntry', function() {
        questionJSON.datatype = Formplayer.Const.STRING;
        entry = (new Question(questionJSON)).entry
        expect(entry instanceof FreeTextEntry).toBe(true);
        expect(entry.templateType).toBe('str');

        entry.answer('harry');
        expect(spy.calledOnce).toBe(true);
    });

    it('Should return MultiSelectEntry', function() {
        questionJSON.datatype = Formplayer.Const.MULTI_SELECT;
        questionJSON.choices = ['a', 'b'];
        questionJSON.answer = ['1']; // answer is based on a 1 indexed index of the choices

        entry = (new Question(questionJSON)).entry
        expect(entry instanceof MultiSelectEntry).toBe(true);
        expect(entry.templateType).toBe('select');

        entry.answer([])
        expect(spy.calledOnce).toBe(true);

        entry.answer(['1'])
        entry.onClear();
        expect(entry.answer().length).toBe(0);
    });

    it('Should return SingleSelectEntry', function() {
        questionJSON.datatype = Formplayer.Const.SELECT;
        questionJSON.choices = ['a', 'b'];
        questionJSON.answer = 'a';

        entry = (new Question(questionJSON)).entry
        expect(entry instanceof SingleSelectEntry).toBe(true);
        expect(entry.templateType).toBe('select');

        entry.answer('b')
        expect(spy.calledOnce).toBe(true);
    });
});
