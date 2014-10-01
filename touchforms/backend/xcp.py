class TouchFormsException(Exception):
    def __unicode__(self):
        if len(self.args) == 1:
            return unicode(self.args[0])
        else:
            return unicode(self.args)

class EmptyCacheFileException(TouchFormsException):
    pass