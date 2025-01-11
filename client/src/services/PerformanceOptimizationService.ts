import { Transaction } from '@solana/web3.js';

interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private transactionCache: Map<string, CacheEntry<Transaction>>;
  private gameStateCache: Map<string, CacheEntry<any>>;
  private config: CacheConfig;

  private constructor() {
    this.config = {
      maxSize: 1000,
      ttl: 5 * 60 * 1000 // 5 minutes
    };
    this.transactionCache = new Map();
    this.gameStateCache = new Map();
  }

  static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  // Cache management
  private cleanCache<T>(cache: Map<string, CacheEntry<T>>): void {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        cache.delete(key);
      }
    }

    // Remove oldest entries if cache exceeds max size
    if (cache.size > this.config.maxSize) {
      const entriesToDelete = Array.from(cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, cache.size - this.config.maxSize);

      for (const [key] of entriesToDelete) {
        cache.delete(key);
      }
    }
  }

  // Transaction caching
  cacheTransaction(id: string, transaction: Transaction): void {
    this.cleanCache(this.transactionCache);
    this.transactionCache.set(id, {
      data: transaction,
      timestamp: Date.now()
    });
  }

  getCachedTransaction(id: string): Transaction | null {
    const entry = this.transactionCache.get(id);
    if (!entry || Date.now() - entry.timestamp > this.config.ttl) {
      this.transactionCache.delete(id);
      return null;
    }
    return entry.data;
  }

  // Game state caching
  cacheGameState(id: string, state: any): void {
    this.cleanCache(this.gameStateCache);
    this.gameStateCache.set(id, {
      data: state,
      timestamp: Date.now()
    });
  }

  getCachedGameState(id: string): any | null {
    const entry = this.gameStateCache.get(id);
    if (!entry || Date.now() - entry.timestamp > this.config.ttl) {
      this.gameStateCache.delete(id);
      return null;
    }
    return entry.data;
  }

  // Batch processing
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      results.push(...batchResults);
    }
    return results;
  }

  // Performance monitoring
  private metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    averageProcessingTime: 0,
    totalProcessed: 0
  };

  updateMetrics(processingTime: number, cacheHit: boolean): void {
    if (cacheHit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    this.metrics.totalProcessed++;
    this.metrics.averageProcessingTime = (
      (this.metrics.averageProcessingTime * (this.metrics.totalProcessed - 1) +
        processingTime) /
      this.metrics.totalProcessed
    );
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / 
        (this.metrics.cacheHits + this.metrics.cacheMisses)
    };
  }

  // Configuration
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    // Clean both caches with new config
    this.cleanCache(this.transactionCache);
    this.cleanCache(this.gameStateCache);
  }
} 