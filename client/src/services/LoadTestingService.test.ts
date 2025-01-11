import { LoadTestingService } from './LoadTestingService';
import { SystemHealthService } from './SystemHealthService';

jest.mock('./SystemHealthService');

describe('LoadTestingService', () => {
  let loadTestingService: LoadTestingService;
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    // Reset singleton instance
    (LoadTestingService as any).instance = null;
    
    // Mock fetch
    mockFetch = jest.spyOn(global, 'fetch').mockImplementation(async () => ({
      ok: true
    } as Response));

    // Mock performance.now
    jest.spyOn(performance, 'now').mockReturnValue(100);

    loadTestingService = LoadTestingService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
    loadTestingService.clearTestHistory();
  });

  it('maintains a singleton instance', () => {
    const instance1 = LoadTestingService.getInstance();
    const instance2 = LoadTestingService.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe('config validation', () => {
    it('validates maximum concurrent users', async () => {
      const config = {
        concurrentUsers: 2000, // Exceeds MAX_CONCURRENT_USERS
        rampUpTime: 10,
        testDuration: 30,
        requestsPerUser: 5,
        targetEndpoints: ['http://test.com/api']
      };

      await expect(loadTestingService.startLoadTest(config)).rejects.toThrow(
        'Maximum concurrent users is 1000'
      );
    });

    it('validates positive time values', async () => {
      const config = {
        concurrentUsers: 100,
        rampUpTime: -1,
        testDuration: 30,
        requestsPerUser: 5,
        targetEndpoints: ['http://test.com/api']
      };

      await expect(loadTestingService.startLoadTest(config)).rejects.toThrow(
        'Time and request values must be positive'
      );
    });

    it('validates target endpoints', async () => {
      const config = {
        concurrentUsers: 100,
        rampUpTime: 10,
        testDuration: 30,
        requestsPerUser: 5,
        targetEndpoints: []
      };

      await expect(loadTestingService.startLoadTest(config)).rejects.toThrow(
        'At least one target endpoint must be specified'
      );
    });
  });

  describe('load test execution', () => {
    const validConfig = {
      concurrentUsers: 10,
      rampUpTime: 2,
      testDuration: 5,
      requestsPerUser: 3,
      targetEndpoints: ['http://test.com/api']
    };

    it('executes load test with correct number of requests', async () => {
      const testId = await loadTestingService.startLoadTest(validConfig);
      
      // Wait for test completion
      await new Promise(resolve => setTimeout(resolve, 
        (validConfig.rampUpTime + validConfig.testDuration) * 1000
      ));

      const summary = loadTestingService.getTestSummary(testId);
      expect(summary).toBeTruthy();
      expect(summary!.totalRequests).toBe(
        validConfig.concurrentUsers * validConfig.requestsPerUser
      );
    });

    it('calculates metrics correctly for successful requests', async () => {
      const testId = await loadTestingService.startLoadTest({
        ...validConfig,
        concurrentUsers: 2,
        requestsPerUser: 2
      });

      // Wait for test completion
      await new Promise(resolve => setTimeout(resolve, 
        (validConfig.rampUpTime + validConfig.testDuration) * 1000
      ));

      const summary = loadTestingService.getTestSummary(testId);
      expect(summary!.successfulRequests).toBe(4); // 2 users * 2 requests
      expect(summary!.failedRequests).toBe(0);
      expect(summary!.errorRate).toBe(0);
    });

    it('handles failed requests correctly', async () => {
      mockFetch.mockImplementationOnce(async () => ({
        ok: false
      } as Response));

      const testId = await loadTestingService.startLoadTest({
        ...validConfig,
        concurrentUsers: 1,
        requestsPerUser: 2
      });

      // Wait for test completion
      await new Promise(resolve => setTimeout(resolve, 
        (validConfig.rampUpTime + validConfig.testDuration) * 1000
      ));

      const summary = loadTestingService.getTestSummary(testId);
      expect(summary!.successfulRequests).toBe(1);
      expect(summary!.failedRequests).toBe(1);
      expect(summary!.errorRate).toBe(50);
    });
  });

  describe('test management', () => {
    it('retrieves all test summaries', async () => {
      const config = {
        concurrentUsers: 1,
        rampUpTime: 1,
        testDuration: 1,
        requestsPerUser: 1,
        targetEndpoints: ['http://test.com/api']
      };

      await loadTestingService.startLoadTest(config);
      await loadTestingService.startLoadTest(config);

      const summaries = loadTestingService.getAllTestSummaries();
      expect(summaries).toHaveLength(2);
    });

    it('clears test history', async () => {
      const config = {
        concurrentUsers: 1,
        rampUpTime: 1,
        testDuration: 1,
        requestsPerUser: 1,
        targetEndpoints: ['http://test.com/api']
      };

      await loadTestingService.startLoadTest(config);
      loadTestingService.clearTestHistory();

      const summaries = loadTestingService.getAllTestSummaries();
      expect(summaries).toHaveLength(0);
    });
  });
}); 