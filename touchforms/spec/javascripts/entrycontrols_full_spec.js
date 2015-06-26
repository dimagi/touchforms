describe('Entries', function() {
    var questionJSON,
        spy;


    beforeEach(function() {
        window.GMAPS_API_KEY = 'xxx';
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
        };
        spy = sinon.spy();
        $.subscribe('formplayer.answer-question', spy);
        this.clock = sinon.useFakeTimers();
    });

    afterEach(function() {
        $.unsubscribe();
        this.clock.restore();
    });

    it('Should return the IntEntry', function() {
        entry = (new Question(questionJSON)).entry;
        expect(entry instanceof IntEntry).toBe(true);
        expect(entry.templateType).toBe('int');

        entry.rawAnswer('1234');
        valid = entry.prevalidate();
        expect(valid).toBe(true);
        this.clock.tick(1000);
        expect(spy.calledOnce).toBe(true);
        expect(entry.answer()).toBe(1234);

        entry.answer('abc');
        valid = entry.prevalidate();
        expect(valid).toBe(false);
        expect(spy.calledOnce).toBe(true);
    });

    it('Should return FloatEntry', function() {
        questionJSON.datatype = Formplayer.Const.FLOAT;
        entry = (new Question(questionJSON)).entry;
        expect(entry instanceof FloatEntry).toBe(true);
        expect(entry.templateType).toBe('float');

        entry.rawAnswer('2.3');
        valid = entry.prevalidate();
        expect(valid).toBe(true);
        this.clock.tick(1000);
        expect(spy.calledOnce).toBe(true);
        expect(entry.answer()).toBe(2.3);

        entry.answer('2.4');
        valid = entry.prevalidate();
        expect(valid).toBe(true);
        expect(spy.calledTwice).toBe(true);

        entry.answer('mouse');
        valid = entry.prevalidate();
        expect(valid).toBe(false);
        expect(spy.calledTwice).toBe(true);
    });

    it('Should return FreeTextEntry', function() {
        questionJSON.datatype = Formplayer.Const.STRING;
        entry = (new Question(questionJSON)).entry;
        expect(entry instanceof FreeTextEntry).toBe(true);
        expect(entry.templateType).toBe('str');

        entry.answer('harry');
        this.clock.tick(1000);
        expect(spy.calledOnce).toBe(true);
    });

    it('Should return MultiSelectEntry', function() {
        questionJSON.datatype = Formplayer.Const.MULTI_SELECT;
        questionJSON.choices = ['a', 'b'];
        questionJSON.answer = null; // answer is based on a 1 indexed index of the choices

        entry = (new Question(questionJSON)).entry;
        expect(entry instanceof MultiSelectEntry).toBe(true);
        expect(entry.templateType).toBe('select');
        expect(entry.answer()).toEqual(null);

        entry.rawAnswer([]);
        this.clock.tick(1000);
        expect(spy.calledOnce).toBe(true);
        expect(entry.answer()).toEqual([]);

        entry.rawAnswer(['1']);
        expect(entry.answer()).toEqual([1]);
    });

    it('Should return SingleSelectEntry', function() {
        questionJSON.datatype = Formplayer.Const.SELECT;
        questionJSON.choices = ['a', 'b'];
        questionJSON.answer = 1;

        entry = (new Question(questionJSON)).entry;
        expect(entry instanceof SingleSelectEntry).toBe(true);
        expect(entry.templateType).toBe('select');

        entry.rawAnswer('1');
        this.clock.tick(1000);
        expect(spy.calledOnce).toBe(true);
        expect(entry.answer()).toBe(1);
    });

    it('Should return DateEntry', function() {
        questionJSON.datatype = Formplayer.Const.DATE;
        questionJSON.answer = '90-09-26';

        entry = (new Question(questionJSON)).entry;
        expect(entry instanceof DateEntry).toBe(true);
        expect(entry.templateType).toBe('date');

        entry.answer('87-11-19');
        this.clock.tick(1000);
        expect(spy.calledOnce).toBe(true);
    });

    it('Should return TimeEntry', function() {
        questionJSON.datatype = Formplayer.Const.TIME;
        questionJSON.answer = '12:30';

        entry = (new Question(questionJSON)).entry;
        expect(entry instanceof TimeEntry).toBe(true);
        expect(entry.templateType).toBe('time');

        entry.answer('12:45');
        this.clock.tick(1000);
        expect(spy.calledOnce).toBe(true);

        entry.answer('12:451');  // Invalid time
        expect(spy.calledOnce).toBe(true);
    });

    it('Should return InfoEntry', function() {
        questionJSON.datatype = Formplayer.Const.INFO;
        entry = (new Question(questionJSON)).entry;

        expect(entry instanceof InfoEntry).toBe(true);
    });

    it('Should return a GeoPointEntry', function() {
        questionJSON.datatype = Formplayer.Const.GEO;
        questionJSON.answer = [1.2, 3.4];

        entry = (new Question(questionJSON)).entry;
        expect(entry.answer()[0]).toBe(1.2);
        expect(entry.answer()[1]).toBe(3.4);

        entry.answer([3,3]);
        this.clock.tick(1000);
        expect(spy.calledOnce).toBe(true);

        entry.answer([3,3]); // do not call on same values
        expect(spy.calledOnce).toBe(true);
    });

    it('Should return a PhoneEntry', function() {
        questionJSON.datatype = Formplayer.Const.STRING;
        questionJSON.style = { raw: 'numeric' };

        entry = (new Question(questionJSON)).entry;
        expect(entry instanceof PhoneEntry).toBe(true);
        expect(entry.answer()).toBe(null);
        expect(entry.templateType).toBe('phone');

        entry.rawAnswer('1234');
        this.clock.tick(1000);
        expect(spy.calledOnce).toBe(true);
        expect(entry.answer()).toBe(1234);

        entry.answer('abc'); // Invalid entry should not answer question
        expect(spy.calledOnce).toBe(true);
        expect(entry.question.error()).toBeTruthy();
    });
});
