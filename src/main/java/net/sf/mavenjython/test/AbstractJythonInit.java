package net.sf.mavenjython.test;
import java.util.Properties;

import org.python.core.Py;
import org.python.core.PyFile;
import org.python.core.PySystemState;
import org.python.core.imp;
import org.python.util.InteractiveConsole;
import org.python.util.JLineConsole;

public abstract class AbstractJythonInit {

	protected String[] args;
	protected InteractiveConsole c;

	public AbstractJythonInit(String[] args) {
		this.args = args;

		PySystemState.initialize(PySystemState.getBaseProperties(),
				new Properties(), args);

		c = createInterpreter(checkIsInteractive());
	}

	protected boolean checkIsInteractive() {
		PySystemState systemState = Py.getSystemState();
		boolean interactive = ((PyFile) Py.defaultSystemState.stdin).isatty();
		if (!interactive) {
			systemState.ps1 = systemState.ps2 = Py.EmptyString;
		}
		return interactive;
	}

	protected InteractiveConsole createInterpreter(boolean interactive) {
		InteractiveConsole c = newInterpreter(interactive);
		Py.getSystemState().__setattr__("_jy_interpreter", Py.java2py(c));

		imp.load("site");
		return c;
	}

	private InteractiveConsole newInterpreter(boolean interactiveStdin) {
		if (!interactiveStdin) {
			return new InteractiveConsole();
		}

		String interpClass = PySystemState.registry.getProperty(
				"python.console", "");
		if (interpClass.length() > 0) {
			try {
				return (InteractiveConsole) Class.forName(interpClass)
						.newInstance();
			} catch (Throwable t) {
				// fall through
			}
		}
		return new JLineConsole();
	}

}
