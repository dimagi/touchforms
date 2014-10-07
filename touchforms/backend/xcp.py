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