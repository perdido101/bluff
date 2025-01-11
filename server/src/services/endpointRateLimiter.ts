interface EndpointRateLimit {
  path: string;
  method: string;
  maxRequests: number;
  timeWindow: number; // in milliseconds
}

interface RequestRecord {
  timestamp: number;
  ip: string;
  endpoint: string;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export class EndpointRateLimiter {
  private requests: RequestRecord[] = [];
  private readonly limits: EndpointRateLimit[];

  constructor(limits: EndpointRateLimit[] = defaultLimits) {
    this.limits = limits;
  }

  canMakeRequest(ip: string, path: string, method: string): boolean {
    this.cleanOldRequests();
    
    const limit = this.getLimitForEndpoint(path, method);
    if (!limit) return true; // No limit for this endpoint

    const endpointRequests = this.requests.filter(
      req => req.ip === ip && 
      req.endpoint === `${method}:${path}` &&
      req.timestamp > Date.now() - limit.timeWindow
    );

    return endpointRequests.length < limit.maxRequests;
  }

  addRequest(ip: string, path: string, method: string): void {
    this.requests.push({
      timestamp: Date.now(),
      ip,
      endpoint: `${method}:${path}`
    });
  }

  private cleanOldRequests(): void {
    const oldestValidTime = Date.now() - Math.max(...this.limits.map(l => l.timeWindow));
    this.requests = this.requests.filter(req => req.timestamp > oldestValidTime);
  }

  private getLimitForEndpoint(path: string, method: string): EndpointRateLimit | undefined {
    return this.limits.find(limit => 
      limit.path === path && 
      limit.method === method
    );
  }

  getRateLimitInfo(ip: string, path: string, method: string): RateLimitInfo {
    const limit = this.getLimitForEndpoint(path, method);
    if (!limit) {
      return { limit: -1, remaining: -1, reset: -1 };
    }

    const endpointRequests = this.requests.filter(
      req => req.ip === ip && 
      req.endpoint === `${method}:${path}` &&
      req.timestamp > Date.now() - limit.timeWindow
    );

    const oldestRequest = endpointRequests[0]?.timestamp || Date.now();
    const reset = Math.ceil((oldestRequest + limit.timeWindow - Date.now()) / 1000);

    return {
      limit: limit.maxRequests,
      remaining: Math.max(0, limit.maxRequests - endpointRequests.length),
      reset
    };
  }
}

const defaultLimits: EndpointRateLimit[] = [
  {
    path: '/api/game/move',
    method: 'POST',
    maxRequests: 60,
    timeWindow: 60000 // 1 minute
  },
  {
    path: '/api/ai/decision',
    method: 'POST',
    maxRequests: 30,
    timeWindow: 60000
  },
  {
    path: '/api/logs/search',
    method: 'GET',
    maxRequests: 20,
    timeWindow: 60000
  },
  {
    path: '/api/dashboard',
    method: 'GET',
    maxRequests: 10,
    timeWindow: 60000
  }
]; 