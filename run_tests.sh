#!/bin/sh
cd touchforms && jython backend/test_server.py && jython backend/test_xformplayer.py && jython backend/test_touchcare.py && jython backend/test_global_state_manager.py
