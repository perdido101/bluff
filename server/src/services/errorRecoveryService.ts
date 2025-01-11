import { GameState, GameAction } from '../types';

interface CircuitBreakerState {
  failures: number;
  lastFailure: Date | null;
  isOpen: boolean;
}

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  exponentialBackoff: boolean;
}

export class ErrorRecoveryService {
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RECOVERY_TIMEOUT_MS = 30000; // 30 seconds

  private defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    delayMs: 1000,
    exponentialBackoff: true
  };

  constructor() {
    // Initialize circuit breakers for critical services
    ['prediction', 'strategy', 'learning', 'personality'].forEach(service => {
      this.circuitBreakers.set(service, {
        failures: 0,
        lastFailure: null,
        isOpen: false
      });
    });
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    serviceName: string,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: Error | null = null;
    
    // Check circuit breaker
    if (this.isCircuitOpen(serviceName)) {
      throw new Error(`Service ${serviceName} is currently unavailable (circuit open)`);
    }

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const result = await operation();
        // Success - reset circuit breaker
        this.resetCircuitBreaker(serviceName);
        return result;
      } catch (error) {
        lastError = error as Error;
        this.recordFailure(serviceName);

        // Check if circuit should open
        if (this.shouldOpenCircuit(serviceName)) {
          this.openCircuit(serviceName);
          throw new Error(`Service ${serviceName} circuit opened after multiple failures`);
        }

        // If not last attempt, wait before retry
        if (attempt < retryConfig.maxAttempts) {
          const delay = retryConfig.exponentialBackoff
            ? retryConfig.delayMs * Math.pow(2, attempt - 1)
            : retryConfig.delayMs;
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error(`Operation failed after ${retryConfig.maxAttempts} attempts`);
  }

  async withFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    serviceName: string
  ): Promise<T> {
    try {
      return await this.withRetry(primaryOperation, serviceName);
    } catch (error) {
      console.warn(`Falling back to backup operation for ${serviceName}:`, error);
      return fallbackOperation();
    }
  }

  private isCircuitOpen(serviceName: string): boolean {
    const state = this.circuitBreakers.get(serviceName);
    if (!state) return false;

    if (state.isOpen) {
      // Check if recovery timeout has elapsed
      if (state.lastFailure && 
          Date.now() - state.lastFailure.getTime() > this.RECOVERY_TIMEOUT_MS) {
        // Allow one request through to test the service
        state.isOpen = false;
        return false;
      }
      return true;
    }
    return false;
  }

  private recordFailure(serviceName: string): void {
    const state = this.circuitBreakers.get(serviceName);
    if (state) {
      state.failures++;
      state.lastFailure = new Date();
    }
  }

  private shouldOpenCircuit(serviceName: string): boolean {
    const state = this.circuitBreakers.get(serviceName);
    return state ? state.failures >= this.FAILURE_THRESHOLD : false;
  }

  private openCircuit(serviceName: string): void {
    const state = this.circuitBreakers.get(serviceName);
    if (state) {
      state.isOpen = true;
      state.lastFailure = new Date();
    }
  }

  private resetCircuitBreaker(serviceName: string): void {
    this.circuitBreakers.set(serviceName, {
      failures: 0,
      lastFailure: null,
      isOpen: false
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getCircuitState(serviceName: string): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(serviceName);
  }

  resetAllCircuits(): void {
    this.circuitBreakers.forEach((_, serviceName) => {
      this.resetCircuitBreaker(serviceName);
    });
  }
} 