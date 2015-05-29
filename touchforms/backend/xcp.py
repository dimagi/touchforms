class TouchFormsException(Exception):
    def __unicode__(self):
        if len(self.args) == 1:
            return unicode(self.args[0], errors="replace")
        else:
            return unicode(self.args)

    def __str__(self):
        if len(self.args) == 1:
            if isinstance(self.args[0], unicode):
                return self.args[0].encode("ascii", "xmlcharrefreplace")
            return str(self.args[0])
        return repr(self.args)


class EmptyCacheFileException(TouchFormsException):
    pass


class TouchFormsBadRequest(TouchFormsException):
    """
    Raise a subclass of this to return a 400 bad request error code
    """
    pass


class TouchFormsUnauthorized(TouchFormsException):
    """
    Raise a subclass of this to return a 401 unauthorized request error code
    """
    pass


class InvalidRequestException(TouchFormsBadRequest):
    pass


class TouchcareInvalidXPath(TouchFormsBadRequest):
    pass


class FormplayerSubmissionError(TouchFormsBadRequest):
    pass
