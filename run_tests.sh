# Run frontend tests
cd touchforms && jasmine-ci --browser phantomjs

# Run backend tests
cd backend && jython -m unittest tests
