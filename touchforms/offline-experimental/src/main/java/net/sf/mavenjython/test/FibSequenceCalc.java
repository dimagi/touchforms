package net.sf.mavenjython.test;

import java.util.Iterator;

/**
 * Fibonacci sequence calculator
 * 
 * @author Johannes
 */
public class FibSequenceCalc implements Iterator<Integer> {

	private int a;
	private int b;

	public FibSequenceCalc() {
		this(0, 1);
	}

	/**
	 * Create a fibonacci sequence starting at start
	 * 
	 * @param starta
	 * @param startb
	 */
	public FibSequenceCalc(int starta, int startb) {
		this.a = starta;
		this.b = startb;
	}

	/**
	 * 
	 * @return next value
	 */
	public int calc() {
		int next = this.a + this.b;
		if (this.a > this.b)
			this.b = next;
		else
			this.a = next;
		return next;
	}

	public boolean hasNext() {
		return true;
	}

	public Integer next() {
		return calc();
	}

	public void remove() {
		throw new IllegalStateException("not a valid call");
	}
}
