import { ErrorReportingService } from './ErrorReportingService';
import { PersistenceService } from './persistenceService';

jest.mock('./persistenceService');

describe('ErrorReportingService', () => {
  let errorService: ErrorReportingService;
  let mockPersistenceService: jest.Mocked<PersistenceService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPersistenceService = {
      load: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue(undefined)
    } as any;

    // Reset singleton instance
    (ErrorReportingService as any).instance = null;
    errorService = ErrorReportingService.getInstance();
  });

  it('maintains a singleton instance', () => {
    const instance1 = ErrorReportingService.getInstance();
    const instance2 = ErrorReportingService.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe('error reporting', () => {
    it('reports an error with correct properties', () => {
      const error = new Error('Test error');
      const errorId = errorService.reportError(error, 'TestComponent', 'high');
      const reportedError = errorService.getError(errorId);

      expect(reportedError).toBeDefined();
      expect(reportedError?.message).toBe('Test error');
      expect(reportedError?.component).toBe('TestComponent');
      expect(reportedError?.severity).toBe('high');
      expect(reportedError?.status).toBe('new');
    });

    it('uses default severity when not specified', () => {
      const error = new Error('Test error');
      const errorId = errorService.reportError(error);
      const reportedError = errorService.getError(errorId);

      expect(reportedError?.severity).toBe('medium');
    });
  });

  describe('error status management', () => {
    it('updates error status correctly', () => {
      const error = new Error('Test error');
      const errorId = errorService.reportError(error);
      
      const updateResult = errorService.updateErrorStatus(errorId, 'acknowledged');
      expect(updateResult).toBe(true);

      const updatedError = errorService.getError(errorId);
      expect(updatedError?.status).toBe('acknowledged');
    });

    it('returns false when updating non-existent error', () => {
      const updateResult = errorService.updateErrorStatus('non-existent', 'resolved');
      expect(updateResult).toBe(false);
    });
  });

  describe('error statistics', () => {
    beforeEach(() => {
      // Report multiple errors for statistics testing
      errorService.reportError(new Error('Critical error'), 'Component1', 'critical');
      errorService.reportError(new Error('High error'), 'Component2', 'high');
      errorService.reportError(new Error('Medium error'), 'Component1', 'medium');
      errorService.reportError(new Error('Low error'), 'Component2', 'low');
    });

    it('calculates error statistics correctly', () => {
      const stats = errorService.getStats();

      expect(stats.totalErrors).toBe(4);
      expect(stats.criticalErrors).toBe(1);
      expect(stats.errorsBySeverity).toEqual({
        critical: 1,
        high: 1,
        medium: 1,
        low: 1
      });
    });

    it('tracks errors by component', () => {
      const stats = errorService.getStats();
      const component1Errors = Array.from(errorService.getRecentErrors())
        .filter(error => error.component === 'Component1');
      const component2Errors = Array.from(errorService.getRecentErrors())
        .filter(error => error.component === 'Component2');

      expect(component1Errors.length).toBe(2);
      expect(component2Errors.length).toBe(2);
    });
  });

  describe('error cleanup', () => {
    it('clears resolved errors', () => {
      const error1Id = errorService.reportError(new Error('Error 1'));
      const error2Id = errorService.reportError(new Error('Error 2'));

      errorService.updateErrorStatus(error1Id, 'resolved');
      errorService.clearResolvedErrors();

      expect(errorService.getError(error1Id)).toBeUndefined();
      expect(errorService.getError(error2Id)).toBeDefined();
    });
  });

  describe('recent errors', () => {
    it('returns recent errors with correct limit', () => {
      // Report 60 errors
      for (let i = 0; i < 60; i++) {
        errorService.reportError(new Error(`Error ${i}`));
      }

      const recentErrors = errorService.getRecentErrors(10);
      expect(recentErrors.length).toBe(10);
      expect(recentErrors[0].message).toBe('Error 59'); // Most recent first
    });

    it('sorts errors by timestamp in descending order', () => {
      const timestamps = [1000, 2000, 3000];
      timestamps.forEach(timestamp => {
        const error = new Error(`Error ${timestamp}`);
        jest.spyOn(Date, 'now').mockReturnValue(timestamp);
        errorService.reportError(error);
      });

      const recentErrors = errorService.getRecentErrors();
      expect(recentErrors[0].timestamp).toBe(3000);
      expect(recentErrors[2].timestamp).toBe(1000);
    });
  });
}); 