from customhandlers import TouchformsFunctionHandler

class StaticFunctionHandler(TouchformsFunctionHandler):
    """
    A function handler that lets you register a static value associated with a function.

    In order to use add the following section to your form context:

    "static": [
        {"name": "foo_func", "value": "foo"},
        {"name": "bar_func", "value": "bar"}
    ]

    This Will add two static context handlers to the session with the following xpath mappings

        foo_func() --> "foo"
        bar_func() --> "bar"

    """

    @classmethod
    def slug(self):
        return 'static'

    def __init__(self, name, value):
        self._name = name
        self._value = value

    def getName(self):
        return self._name

    def eval(self, args, ec):
        return self._value


