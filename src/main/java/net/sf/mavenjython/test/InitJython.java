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
		System.out.print(args.length + " Arguments: ");
		for (String s : args) {
			System.out.print(s);
			System.out.print(", ");
		}
		System.out.println();

		if (args.length > 0) {
			if (args[0].equals("eval"))
				if (args.length > 1)
					c.exec(args[1]);
				else
					c.exec("try:\n import fibcalc\n fibcalc.main()\nexcept SystemExit: pass");
			else if (args[0].equals("run"))
				if (args.length > 1)
					c.execfile(args[1]);
				else
					c.execfile(InitJython.class
							.getResourceAsStream("Lib/fibcalc/__init__.py"),
							"fibcalc/__init__.py");
			else if (args[0].equals("script")) {
				String engineName = args[1];
				ScriptEngine eng = new ScriptEngineManager()
						.getEngineByName(engineName);
				if (eng == null) {
					throw new NullPointerException("Script Engine '"
							+ engineName + "' not found!");
				}
				eng.put("engine", engineName);
				if (args.length > 2) {
					System.out.println("result: " + eng.eval(args[2]));
				} else {
					System.out.println("write your script below; terminate "
							+ "with Ctrl-Z (Windows) or Ctrl-D (Unix) ---");
					try {
						System.out.println("result: "
								+ eng.eval(new InputStreamReader(
										new ConsoleReader().getInput())));
					} catch (IOException e) {
						e.printStackTrace();
					}
				}
			} else
				System.out
						.println("use either eval or run or script as first argument");
		} else
			c.interact();
	}
}
