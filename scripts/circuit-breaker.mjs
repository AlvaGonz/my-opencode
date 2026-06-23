// scripts/circuit-breaker.mjs
// Deterministic circuit breaker — throws Error when MAX_RETRIES exceeded
// The LLM NEVER decides to stop — this code does.
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const COUNTER_FILE = 'agents/loop-run-counter.txt';
const LOCK_DIR = 'agents/loop-locks';
const MAX_RETRIES = 3;

export class CircuitBreaker {
  #operationId;
  #lockFile;
  #count = 0;

  constructor(operationId) {
    this.#operationId = operationId;
    this.#lockFile = join(LOCK_DIR, `${operationId}.lock`);
    this.#load();
  }

  #load() {
    if (existsSync(this.#lockFile)) {
      const raw = readFileSync(this.#lockFile, 'utf8').trim();
      this.#count = parseInt(raw, 10) || 0;
    }
  }

  #save() {
    writeFileSync(this.#lockFile, String(this.#count), 'utf8');
    // Also update the global counter for visibility
    writeFileSync(COUNTER_FILE, String(this.#count), 'utf8');
  }

  /**
   * Call before each retry attempt.
   * Throws a hard Error if MAX_RETRIES is exceeded.
   * @param {string} context - What operation is being retried (for the error message)
   */
  increment(context = '') {
    this.#count++;
    this.#save();

    if (this.#count > MAX_RETRIES) {
      const msg = `[CircuitBreaker] OPEN — Operation "${this.#operationId}" exceeded ${MAX_RETRIES} retries. ${context ? 'Context: ' + context : ''} Human intervention required.`;
      console.error(msg);
      throw new Error(msg); // Hard stop — deterministic, not probabilistic
    }

    console.log(`[CircuitBreaker] Attempt ${this.#count}/${MAX_RETRIES} for "${this.#operationId}"`);
  }

  /** Call on success to reset the counter and remove the lock file */
  reset() {
    this.#count = 0;
    if (existsSync(this.#lockFile)) {
      import('fs').then(({ unlinkSync }) => {
        try { unlinkSync(this.#lockFile); } catch {}
      });
    }
    writeFileSync(COUNTER_FILE, '0', 'utf8');
    console.log(`[CircuitBreaker] CLOSED — "${this.#operationId}" succeeded and reset.`);
  }

  get attempts() { return this.#count; }
  get isOpen() { return this.#count >= MAX_RETRIES; }
}

// Usage example (do not remove — serves as documentation):
// import { CircuitBreaker } from './scripts/circuit-breaker.mjs';
// const cb = new CircuitBreaker('skill-scanner');
// try {
//   cb.increment('Scanning skills/');
//   await runScan();
//   cb.reset();
// } catch (err) {
//   if (err.message.includes('CircuitBreaker')) throw err; // Re-throw to stop the agent
//   cb.increment(err.message); // Count this as a failure
// }
