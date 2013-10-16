package net.sf.mavenjython.test;
import java.io.IOException;
import java.io.InputStreamReader;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;

import jline.ConsoleReader;

/**
 * The point of all the jython install madness is that we can call jython now.
 * 
 * So we want:
 * 
 * Java initialization class (this) --&gt; Jython/Python installation --&gt;
 * Python script --&gt; uses some Java code
 * 
 * @author user
 * 
 */
public class InitJython extends AbstractJythonInit {

	public InitJython(String[] args) {
		super(args);
	}

	public static void main(String[] args) throws ScriptException {
		System.out.println("Java started");
		new InitJython(args).run();
		System.out.println("Java exiting");
	}

	public void run() throws ScriptException {
        //c.exec("try:\n import fibcalc\n fibcalc.main()\nexcept SystemExit: pass");
        //c.execfile(InitJython.class.getResourceAsStream("Lib/touchforms/xformserver.py"),
        //           "touchforms/xformserver.py");


        c.exec("from touchforms import xformserver\nxformserver.main(port=4444, stale_window=3, ext_mod=[])\n");
	}
}
