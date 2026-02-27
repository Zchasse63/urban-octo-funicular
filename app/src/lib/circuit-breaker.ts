/**
 * Simple circuit breaker for external API calls.
 * States: CLOSED (normal), OPEN (failing, reject calls), HALF_OPEN (testing recovery)
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreakerOptions {
  failureThreshold: number  // Number of failures before opening circuit
  resetTimeout: number      // Time in ms before trying again (half-open)
  name: string             // For logging
}

interface CircuitBreakerState {
  state: CircuitState
  failures: number
  lastFailureTime: number
  successesSinceHalfOpen: number
}

const circuits = new Map<string, CircuitBreakerState>()

function getState(name: string): CircuitBreakerState {
  if (!circuits.has(name)) {
    circuits.set(name, {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: 0,
      successesSinceHalfOpen: 0,
    })
  }
  return circuits.get(name)!
}

export class CircuitBreaker {
  private options: CircuitBreakerOptions

  constructor(options: CircuitBreakerOptions) {
    this.options = options
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = getState(this.options.name)

    if (state.state === 'OPEN') {
      // Check if we should move to half-open
      if (Date.now() - state.lastFailureTime >= this.options.resetTimeout) {
        state.state = 'HALF_OPEN'
        state.successesSinceHalfOpen = 0
        console.log(`[CircuitBreaker:${this.options.name}] Moving to HALF_OPEN`)
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.options.name}. Try again later.`)
      }
    }

    try {
      const result = await fn()
      this.onSuccess(state)
      return result
    } catch (error) {
      this.onFailure(state)
      throw error
    }
  }

  private onSuccess(state: CircuitBreakerState): void {
    if (state.state === 'HALF_OPEN') {
      state.successesSinceHalfOpen++
      if (state.successesSinceHalfOpen >= 2) {
        state.state = 'CLOSED'
        state.failures = 0
        console.log(`[CircuitBreaker:${this.options.name}] Circuit CLOSED (recovered)`)
      }
    } else {
      state.failures = 0
    }
  }

  private onFailure(state: CircuitBreakerState): void {
    state.failures++
    state.lastFailureTime = Date.now()

    if (state.failures >= this.options.failureThreshold) {
      state.state = 'OPEN'
      console.log(`[CircuitBreaker:${this.options.name}] Circuit OPEN after ${state.failures} failures`)
    }
  }

  getStatus(): { state: CircuitState; failures: number } {
    const state = getState(this.options.name)
    return { state: state.state, failures: state.failures }
  }
}

// Pre-configured circuit breakers for external services
export const xaiCircuitBreaker = new CircuitBreaker({
  name: 'xai',
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
})

export const assemblyaiCircuitBreaker = new CircuitBreaker({
  name: 'assemblyai',
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
})
