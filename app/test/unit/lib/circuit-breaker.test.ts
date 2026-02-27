/**
 * Tests for circuit-breaker.ts
 *
 * The circuit breaker protects against cascading failures when xAI or
 * AssemblyAI go down. If it's broken, an API outage takes down the
 * entire platform instead of gracefully degrading.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker } from '@/lib/circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    // Fresh breaker for each test with low thresholds for fast tests
    breaker = new CircuitBreaker({
      name: `test-${Date.now()}-${Math.random()}`,
      failureThreshold: 3,
      resetTimeout: 100, // 100ms for fast tests
    });
  });

  describe('CLOSED state (normal operation)', () => {
    it('executes function and returns result when closed', async () => {
      const result = await breaker.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });

    it('starts in CLOSED state', () => {
      const status = breaker.getStatus();
      expect(status.state).toBe('CLOSED');
      expect(status.failures).toBe(0);
    });

    it('resets failure count on success', async () => {
      // Fail twice (below threshold)
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch { /* expected */ }
      }
      expect(breaker.getStatus().failures).toBe(2);

      // Succeed once
      await breaker.execute(() => Promise.resolve('ok'));
      expect(breaker.getStatus().failures).toBe(0);
    });

    it('propagates errors from the wrapped function', async () => {
      await expect(
        breaker.execute(() => Promise.reject(new Error('api down')))
      ).rejects.toThrow('api down');
    });
  });

  describe('CLOSED → OPEN transition', () => {
    it('opens after reaching failure threshold', async () => {
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch { /* expected */ }
      }

      expect(breaker.getStatus().state).toBe('OPEN');
      expect(breaker.getStatus().failures).toBe(3);
    });

    it('does not open below threshold', async () => {
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch { /* expected */ }
      }

      expect(breaker.getStatus().state).toBe('CLOSED');
    });
  });

  describe('OPEN state (rejecting calls)', () => {
    beforeEach(async () => {
      // Trip the breaker
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch { /* expected */ }
      }
    });

    it('rejects calls immediately when OPEN', async () => {
      await expect(
        breaker.execute(() => Promise.resolve('should not run'))
      ).rejects.toThrow(/Circuit breaker is OPEN/);
    });

    it('does not call the wrapped function when OPEN', async () => {
      const fn = vi.fn().mockResolvedValue('ok');
      try {
        await breaker.execute(fn);
      } catch { /* expected */ }
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('OPEN → HALF_OPEN transition', () => {
    beforeEach(async () => {
      // Trip the breaker
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch { /* expected */ }
      }
    });

    it('moves to HALF_OPEN after reset timeout', async () => {
      // Wait for the reset timeout
      await new Promise(r => setTimeout(r, 150));

      // Next call should go through (HALF_OPEN allows a probe)
      const result = await breaker.execute(() => Promise.resolve('recovered'));
      expect(result).toBe('recovered');
    });
  });

  describe('HALF_OPEN → CLOSED transition', () => {
    beforeEach(async () => {
      // Trip the breaker
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch { /* expected */ }
      }
      // Wait for reset timeout
      await new Promise(r => setTimeout(r, 150));
    });

    it('closes after 2 consecutive successes in HALF_OPEN', async () => {
      await breaker.execute(() => Promise.resolve('success 1'));
      // Still HALF_OPEN after 1 success
      // (internal state - can't easily check, but circuit should still work)

      await breaker.execute(() => Promise.resolve('success 2'));
      // Now should be CLOSED
      expect(breaker.getStatus().state).toBe('CLOSED');
      expect(breaker.getStatus().failures).toBe(0);
    });
  });

  describe('HALF_OPEN → OPEN transition (on failure)', () => {
    beforeEach(async () => {
      // Trip the breaker
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch { /* expected */ }
      }
      // Wait for reset timeout
      await new Promise(r => setTimeout(r, 150));
    });

    it('reopens on failure during HALF_OPEN', async () => {
      // Fail during half-open probe
      try {
        await breaker.execute(() => Promise.reject(new Error('still broken')));
      } catch { /* expected */ }

      // Should be OPEN again (failures incremented past threshold)
      expect(breaker.getStatus().state).toBe('OPEN');
    });
  });

  describe('separate circuit breaker instances', () => {
    it('different names have independent state', async () => {
      const breaker1 = new CircuitBreaker({
        name: `test-a-${Date.now()}`,
        failureThreshold: 2,
        resetTimeout: 100,
      });
      const breaker2 = new CircuitBreaker({
        name: `test-b-${Date.now()}`,
        failureThreshold: 2,
        resetTimeout: 100,
      });

      // Trip breaker1
      for (let i = 0; i < 2; i++) {
        try {
          await breaker1.execute(() => Promise.reject(new Error('fail')));
        } catch { /* expected */ }
      }

      expect(breaker1.getStatus().state).toBe('OPEN');
      expect(breaker2.getStatus().state).toBe('CLOSED');

      // breaker2 should still work
      const result = await breaker2.execute(() => Promise.resolve('ok'));
      expect(result).toBe('ok');
    });
  });

  describe('async function handling', () => {
    it('handles slow async functions', async () => {
      const result = await breaker.execute(async () => {
        await new Promise(r => setTimeout(r, 50));
        return 'slow result';
      });
      expect(result).toBe('slow result');
    });

    it('handles functions that throw synchronously', async () => {
      await expect(
        breaker.execute(() => { throw new Error('sync throw'); })
      ).rejects.toThrow('sync throw');
    });
  });
});
