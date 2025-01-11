interface PerformanceMetrics {
  requestStartTime: number;
  aiDecisionTime: number;
  moveValidationTime: number;
  totalResponseTime: number;
  endpoint: string;
}

export class PerformanceMonitorService {
  private metrics: PerformanceMetrics[] = [];
  private currentMetric: Partial<PerformanceMetrics> = {};

  startRequest(endpoint: string): void {
    this.currentMetric = {
      requestStartTime: Date.now(),
      endpoint
    };
  }

  measureOperation(operation: keyof PerformanceMetrics, startTime: number): void {
    const duration = Date.now() - startTime;
    this.currentMetric[operation] = duration;
  }

  endRequest(): void {
    if (this.currentMetric.requestStartTime) {
      this.currentMetric.totalResponseTime = 
        Date.now() - this.currentMetric.requestStartTime;
      this.metrics.push(this.currentMetric as PerformanceMetrics);
    }
  }

  getMetrics(): {
    averageResponseTime: number;
    averageAIDecisionTime: number;
    slowestEndpoints: { endpoint: string; time: number }[];
  } {
    const avgResponse = this.calculateAverage('totalResponseTime');
    const avgAIDecision = this.calculateAverage('aiDecisionTime');
    const slowestEndpoints = this.getSlowestEndpoints(5);

    return {
      averageResponseTime: avgResponse,
      averageAIDecisionTime: avgAIDecision,
      slowestEndpoints
    };
  }

  private calculateAverage(metric: keyof PerformanceMetrics): number {
    const validMetrics = this.metrics.filter(m => m[metric]);
    if (validMetrics.length === 0) return 0;

    const sum = validMetrics.reduce((acc, curr) => acc + (curr[metric] as number), 0);
    return sum / validMetrics.length;
  }

  private getSlowestEndpoints(limit: number): { endpoint: string; time: number }[] {
    return this.metrics
      .map(m => ({
        endpoint: m.endpoint,
        time: m.totalResponseTime
      }))
      .sort((a, b) => b.time - a.time)
      .slice(0, limit);
  }
} 