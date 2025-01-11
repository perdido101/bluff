interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number; // in milliseconds
  cooldown: number;
}

export class RateLimiterService {
  private requests: { timestamp: number; ip: string }[] = [];
  private blockedIPs: Set<string> = new Set();
  private readonly defaultConfig: RateLimitConfig = {
    maxRequests: 100,
    timeWindow: 60000, // 1 minute
    cooldown: 300000  // 5 minutes
  };

  constructor(private config: RateLimitConfig = this.defaultConfig) {}

  canMakeRequest(ip: string): boolean {
    this.cleanOldRequests();
    
    // Check if IP is blocked
    if (this.blockedIPs.has(ip)) {
      return false;
    }

    // Count requests from this IP in the time window
    const recentRequests = this.requests.filter(
      req => req.ip === ip && 
      req.timestamp > Date.now() - this.config.timeWindow
    ).length;

    // Block IP if too many requests
    if (recentRequests >= this.config.maxRequests) {
      this.blockIP(ip);
      return false;
    }

    return true;
  }

  addRequest(ip: string): void {
    this.requests.push({
      timestamp: Date.now(),
      ip
    });
  }

  private cleanOldRequests(): void {
    const cutoff = Date.now() - this.config.timeWindow;
    this.requests = this.requests.filter(req => req.timestamp > cutoff);
  }

  private blockIP(ip: string): void {
    this.blockedIPs.add(ip);
    setTimeout(() => {
      this.blockedIPs.delete(ip);
    }, this.config.cooldown);
  }

  getStats(): { totalRequests: number; blockedIPs: number } {
    return {
      totalRequests: this.requests.length,
      blockedIPs: this.blockedIPs.size
    };
  }
} 