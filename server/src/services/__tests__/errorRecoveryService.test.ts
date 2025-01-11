import { ErrorRecoveryService } from '../errorRecoveryService';

describe('ErrorRecoveryService', () => {
  let service: ErrorRecoveryService;
  
  beforeEach(() => {
    service = new ErrorRecoveryService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('retry mechanism', () => {
    it('should retry failed operations up to max attempts', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1'))
        .mockRejectedValueOnce(new Error('Attempt 2'))
        .mockResolvedValueOnce('success');

      const result = await service.withRetry(operation, 'test-service');
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(service.withRetry(operation, 'test-service'))
        .rejects
        .toThrow('Always fails');
      
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1'))
        .mockRejectedValueOnce(new Error('Attempt 2'))
        .mockResolvedValueOnce('success');

      const promise = service.withRetry(operation, 'test-service');
      
      // First retry should wait 1000ms
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
      jest.advanceTimersByTime(1000);
      
      // Second retry should wait 2000ms
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
      jest.advanceTimersByTime(2000);
      
      const result = await promise;
      expect(result).toBe('success');
    });
  });

  describe('circuit breaker', () => {
    it('should open circuit after threshold failures', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));

      // Cause multiple failures
      for (let i = 0; i < 5; i++) {
        try {
          await service.withRetry(operation, 'test-service', { maxAttempts: 1 });
        } catch (error) {
          // Expected
        }
      }

      // Next attempt should fail immediately due to open circuit
      await expect(service.withRetry(() => Promise.resolve('success'), 'test-service'))
        .rejects
        .toThrow('Service test-service is currently unavailable (circuit open)');
    });

    it('should reset circuit after recovery timeout', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await service.withRetry(operation, 'test-service', { maxAttempts: 1 });
        } catch (error) {
          // Expected
        }
      }

      // Advance time past recovery timeout
      jest.advanceTimersByTime(31000);

      // Circuit should allow one test request
      operation.mockResolvedValueOnce('success');
      const result = await service.withRetry(operation, 'test-service');
      expect(result).toBe('success');
    });

    it('should maintain separate circuit states for different services', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Service error'));
      const successOperation = jest.fn().mockResolvedValue('success');

      // Open circuit for service1
      for (let i = 0; i < 5; i++) {
        try {
          await service.withRetry(failingOperation, 'service1', { maxAttempts: 1 });
        } catch (error) {
          // Expected
        }
      }

      // service2 should still work
      const result = await service.withRetry(successOperation, 'service2');
      expect(result).toBe('success');
    });
  });

  describe('fallback mechanism', () => {
    it('should use fallback when primary operation fails', async () => {
      const primaryOp = jest.fn().mockRejectedValue(new Error('Primary failed'));
      const fallbackOp = jest.fn().mockResolvedValue('fallback result');

      const result = await service.withFallback(primaryOp, fallbackOp, 'test-service');
      
      expect(result).toBe('fallback result');
      expect(primaryOp).toHaveBeenCalled();
      expect(fallbackOp).toHaveBeenCalled();
    });

    it('should not use fallback when primary operation succeeds', async () => {
      const primaryOp = jest.fn().mockResolvedValue('primary result');
      const fallbackOp = jest.fn().mockResolvedValue('fallback result');

      const result = await service.withFallback(primaryOp, fallbackOp, 'test-service');
      
      expect(result).toBe('primary result');
      expect(primaryOp).toHaveBeenCalled();
      expect(fallbackOp).not.toHaveBeenCalled();
    });
  });

  describe('circuit state management', () => {
    it('should track circuit state', () => {
      const state = service.getCircuitState('prediction');
      expect(state).toEqual({
        failures: 0,
        lastFailure: null,
        isOpen: false
      });
    });

    it('should reset all circuits', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));

      // Open a circuit
      for (let i = 0; i < 5; i++) {
        try {
          await service.withRetry(operation, 'test-service', { maxAttempts: 1 });
        } catch (error) {
          // Expected
        }
      }

      service.resetAllCircuits();
      
      const state = service.getCircuitState('test-service');
      expect(state).toEqual({
        failures: 0,
        lastFailure: null,
        isOpen: false
      });
    });
  });
}); 