import Redis from 'ioredis';
import { promisify } from 'util';
import { logger } from './loggerService';

interface LockOptions {
  ttl: number;        // Time to live in milliseconds
  retryCount: number; // Number of retry attempts
  retryDelay: number; // Delay between retries in milliseconds
}

export class LockManager {
  private redis: Redis;
  private readonly defaultOptions: LockOptions = {
    ttl: 30000,       // 30 seconds
    retryCount: 3,
    retryDelay: 1000  // 1 second
  };

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async acquire(key: string, options: Partial<LockOptions> = {}): Promise<boolean> {
    const opts = { ...this.defaultOptions, ...options };
    const lockKey = `lock:${key}`;
    const lockValue = Date.now().toString();

    for (let i = 0; i <= opts.retryCount; i++) {
      try {
        const acquired = await this.redis.set(
          lockKey,
          lockValue,
          'PX',
          opts.ttl,
          'NX'
        );

        if (acquired) {
          return true;
        }

        if (i < opts.retryCount) {
          await this.delay(opts.retryDelay);
        }
      } catch (error) {
        logger.logError(error, {
          context: 'LockManager.acquire',
          key,
          attempt: i
        });
      }
    }

    return false;
  }

  async release(key: string): Promise<void> {
    const lockKey = `lock:${key}`;
    try {
      await this.redis.del(lockKey);
    } catch (error) {
      logger.logError(error, {
        context: 'LockManager.release',
        key
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup(): Promise<void> {
    await this.redis.quit();
  }
} 