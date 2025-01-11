import { SystemHealthService } from './SystemHealthService';

interface LoadTestConfig {
  concurrentUsers: number;
  rampUpTime: number; // seconds
  testDuration: number; // seconds
  requestsPerUser: number;
  targetEndpoints: string[];
}

interface LoadTestResult {
  timestamp: number;
  endpoint: string;
  responseTime: number;
  success: boolean;
  error?: string;
  concurrentUsers: number;
}

interface LoadTestSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  startTime: number;
  endTime: number;
  config: LoadTestConfig;
  results: LoadTestResult[];
}

export class LoadTestingService {
  private static instance: LoadTestingService;
  private healthService: SystemHealthService;
  private activeTests: Map<string, LoadTestSummary>;
  private readonly MAX_CONCURRENT_USERS = 1000;

  private constructor() {
    this.healthService = SystemHealthService.getInstance();
    this.activeTests = new Map();
  }

  static getInstance(): LoadTestingService {
    if (!LoadTestingService.instance) {
      LoadTestingService.instance = new LoadTestingService();
    }
    return LoadTestingService.instance;
  }

  async startLoadTest(config: LoadTestConfig): Promise<string> {
    this.validateConfig(config);
    
    const testId = Date.now().toString();
    const summary: LoadTestSummary = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      startTime: Date.now(),
      endTime: 0,
      config,
      results: []
    };

    this.activeTests.set(testId, summary);
    this.runLoadTest(testId, config);

    return testId;
  }

  private validateConfig(config: LoadTestConfig): void {
    if (config.concurrentUsers > this.MAX_CONCURRENT_USERS) {
      throw new Error(`Maximum concurrent users is ${this.MAX_CONCURRENT_USERS}`);
    }
    if (config.rampUpTime < 0 || config.testDuration < 0 || config.requestsPerUser < 0) {
      throw new Error('Time and request values must be positive');
    }
    if (!config.targetEndpoints.length) {
      throw new Error('At least one target endpoint must be specified');
    }
  }

  private async runLoadTest(testId: string, config: LoadTestConfig): Promise<void> {
    const summary = this.activeTests.get(testId)!;
    const usersPerSecond = config.concurrentUsers / config.rampUpTime;
    let currentUsers = 0;

    // Ramp up phase
    for (let i = 0; i < config.rampUpTime && currentUsers < config.concurrentUsers; i++) {
      const newUsers = Math.min(
        Math.floor(usersPerSecond),
        config.concurrentUsers - currentUsers
      );
      await this.spawnUsers(testId, newUsers, config);
      currentUsers += newUsers;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Maintain load
    await new Promise(resolve => setTimeout(resolve, config.testDuration * 1000));

    // Complete test
    summary.endTime = Date.now();
    this.calculateTestMetrics(testId);
  }

  private async spawnUsers(
    testId: string,
    count: number,
    config: LoadTestConfig
  ): Promise<void> {
    const userPromises = Array(count)
      .fill(0)
      .map(() => this.simulateUser(testId, config));
    
    await Promise.all(userPromises);
  }

  private async simulateUser(
    testId: string,
    config: LoadTestConfig
  ): Promise<void> {
    const summary = this.activeTests.get(testId)!;

    for (let i = 0; i < config.requestsPerUser; i++) {
      const endpoint = config.targetEndpoints[
        Math.floor(Math.random() * config.targetEndpoints.length)
      ];

      const result = await this.makeRequest(endpoint, summary.results.length);
      summary.results.push(result);
      
      if (result.success) {
        summary.successfulRequests++;
      } else {
        summary.failedRequests++;
      }
      summary.totalRequests++;

      // Random delay between requests (100-300ms)
      await new Promise(resolve => 
        setTimeout(resolve, 100 + Math.random() * 200)
      );
    }
  }

  private async makeRequest(
    endpoint: string,
    concurrentUsers: number
  ): Promise<LoadTestResult> {
    const start = performance.now();
    const result: LoadTestResult = {
      timestamp: Date.now(),
      endpoint,
      responseTime: 0,
      success: false,
      concurrentUsers
    };

    try {
      const response = await fetch(endpoint);
      result.success = response.ok;
      result.responseTime = performance.now() - start;
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.responseTime = performance.now() - start;
    }

    return result;
  }

  private calculateTestMetrics(testId: string): void {
    const summary = this.activeTests.get(testId)!;
    const responseTimes = summary.results
      .filter(r => r.success)
      .map(r => r.responseTime)
      .sort((a, b) => a - b);

    if (responseTimes.length > 0) {
      summary.averageResponseTime = 
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      summary.p95ResponseTime = 
        responseTimes[Math.floor(responseTimes.length * 0.95)];
      summary.p99ResponseTime = 
        responseTimes[Math.floor(responseTimes.length * 0.99)];
    }

    summary.errorRate = 
      (summary.failedRequests / summary.totalRequests) * 100;
  }

  getTestSummary(testId: string): LoadTestSummary | null {
    return this.activeTests.get(testId) || null;
  }

  getAllTestSummaries(): LoadTestSummary[] {
    return Array.from(this.activeTests.values());
  }

  clearTestHistory(): void {
    this.activeTests.clear();
  }
} 