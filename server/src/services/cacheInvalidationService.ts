interface CacheInvalidation {
  pattern: string;
  relatedEndpoints: string[];
  invalidateOn: string[];
}

export class CacheInvalidationService {
  private readonly invalidationRules: CacheInvalidation[] = [
    {
      pattern: '/api/game/move',
      relatedEndpoints: ['/api/dashboard'],
      invalidateOn: ['POST']
    },
    {
      pattern: '/api/logs/search',
      relatedEndpoints: ['/api/dashboard', '/api/health/detailed'],
      invalidateOn: ['POST', 'PUT', 'DELETE']
    }
  ];

  constructor(private cacheService: CacheService) {}

  shouldInvalidate(path: string, method: string): string[] {
    const matchingRules = this.invalidationRules.filter(
      rule => 
        path.startsWith(rule.pattern) && 
        rule.invalidateOn.includes(method)
    );

    return matchingRules.flatMap(rule => rule.relatedEndpoints);
  }

  async invalidateRelatedCaches(path: string, method: string): Promise<void> {
    const endpointsToInvalidate = this.shouldInvalidate(path, method);
    
    if (endpointsToInvalidate.length > 0) {
      // Get all cache keys
      const allKeys = Array.from(this.cacheService.getKeys());
      
      // Find and invalidate matching keys
      const keysToInvalidate = allKeys.filter(key => 
        endpointsToInvalidate.some(endpoint => key.startsWith(endpoint))
      );

      keysToInvalidate.forEach(key => this.cacheService.delete(key));
    }
  }
} 