
print "Python started."

from net.sf.mavenjython.test import FibSequenceCalc

import nose

def main():
	fc = FibSequenceCalc()
	print dir(nose)
	print [fc.calc() for i in dir(nose)]

