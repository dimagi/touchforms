import sys
# workarounds for jython standalone-mode bug
sys.packageManager.makeJavaPackage("java.awt", "Window", None)
sys.packageManager.makeJavaPackage("javax.swing", "JWindow", None)

import Launch
import java.lang
from java.awt import SystemTray, Toolkit, PopupMenu, MenuItem, TrayIcon, AWTException
#from javax.swing import ...

CMD_CLOSE = 'Close'
NAME = "Offline Cloudcare"

def init_gui():
    using_systray = False
    if SystemTray.isSupported():
        tray = SystemTray.getSystemTray()
        image = Toolkit.getDefaultToolkit().getImage(Launch().getClass().getResource("systray.png"))
        def onAction(e):
            cmd = e.getActionCommand()
            if cmd is None:
                # systray icon was double-clicked
                # TODO do something cool
                pass
            elif cmd == CMD_CLOSE:
                # TODO warn if active sessions
                java.lang.System.exit(0)  # sys.exit() is not reliable due to gui threads
        
        # systray doesn't support swing menus... come on!!
        popup = PopupMenu()
        close = MenuItem(CMD_CLOSE, actionPerformed=onAction)

        status = MenuItem("Starting up...")

        popup.add(status)
        popup.addSeparator()
        popup.add(close)

        trayIcon = TrayIcon(image, NAME, popup, actionPerformed=onAction)
        trayIcon.setImageAutoSize(True)

        try:
            tray.add(trayIcon)
            using_systray = True
        except AWTException, e:
            pass
        
    if not using_systray:
        print 'systray failed'
        # TODO fallback to a normal GUI window

    class GUIContext(object):
        def set_num_sessions(self, num_sessions):
            sess_str = '%s active %s' % (num_sessions or 'no', 'session' if num_sessions == 1 else 'sessions')
            status.setLabel('Running... %s' % sess_str)
            trayIcon.setToolTip(NAME if not num_sessions else '%s: %s' % (NAME, sess_str))
    return GUIContext()

class StubContext(object):
    def set_num_sessions(self, *args, **kwargs):
        pass
