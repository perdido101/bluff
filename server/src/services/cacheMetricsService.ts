interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
  averageAccessTime: number;
}

export class CacheMetricsService {
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private accessTimes: number[] = [];
  private readonly maxAccessTimeHistory = 1000;

  recordHit(accessTime: number): void {
    this.hits++;
    this.recordAccessTime(accessTime);
  }

  recordMiss(): void {
    this.misses++;
  }

  recordEviction(): void {
    this.evictions++;
  }

  private recordAccessTime(time: number): void {
    this.accessTimes.push(time);
    if (this.accessTimes.length > this.maxAccessTimeHistory) {
      this.accessTimes.shift();
    }
  }

  getMetrics(currentSize: number): CacheMetrics {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests === 0 ? 0 : this.hits / totalRequests;
    const averageAccessTime = this.accessTimes.length === 0 
      ? 0 
      : this.accessTimes.reduce((a, b) => a + b, 0) / this.accessTimes.length;

    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      size: currentSize,
      hitRate,
      averageAccessTime
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.accessTimes = [];
  }
} 