#!/bin/sh
# Run frontend tests
cd touchforms && jasmine-ci --browser phantomjs

# Run backend tests
cd backend && ~/jython/bin/jython -m unittest tests
