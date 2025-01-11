import { SystemHealthService } from './SystemHealthService';

interface BrowserFeature {
  name: string;
  supported: boolean;
  fallbackAvailable: boolean;
  details?: string;
}

interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  features: BrowserFeature[];
  timestamp: number;
}

interface CompatibilityIssue {
  feature: string;
  browser: string;
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  workaround?: string;
}

export class BrowserCompatibilityService {
  private static instance: BrowserCompatibilityService;
  private healthService: SystemHealthService;
  private browserInfo: BrowserInfo | null = null;
  private issues: CompatibilityIssue[] = [];

  private constructor() {
    this.healthService = SystemHealthService.getInstance();
  }

  static getInstance(): BrowserCompatibilityService {
    if (!BrowserCompatibilityService.instance) {
      BrowserCompatibilityService.instance = new BrowserCompatibilityService();
    }
    return BrowserCompatibilityService.instance;
  }

  checkCompatibility(): void {
    this.detectBrowser();
    this.checkFeatures();
    this.reportIssues();
  }

  private detectBrowser(): void {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    
    let browserName = 'Unknown';
    let version = 'Unknown';

    if (ua.includes('Chrome')) {
      browserName = 'Chrome';
      version = ua.match(/Chrome\/(\d+\.\d+)/)![1];
    } else if (ua.includes('Firefox')) {
      browserName = 'Firefox';
      version = ua.match(/Firefox\/(\d+\.\d+)/)![1];
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browserName = 'Safari';
      version = ua.match(/Version\/(\d+\.\d+)/)![1];
    } else if (ua.includes('Edge')) {
      browserName = 'Edge';
      version = ua.match(/Edge\/(\d+\.\d+)/)![1];
    }

    this.browserInfo = {
      name: browserName,
      version,
      platform,
      features: [],
      timestamp: Date.now()
    };
  }

  private checkFeatures(): void {
    if (!this.browserInfo) return;

    const features: BrowserFeature[] = [
      {
        name: 'WebGL',
        supported: !!window.WebGLRenderingContext,
        fallbackAvailable: true,
        details: 'Required for game graphics'
      },
      {
        name: 'WebSocket',
        supported: 'WebSocket' in window,
        fallbackAvailable: false,
        details: 'Required for real-time communication'
      },
      {
        name: 'LocalStorage',
        supported: !!window.localStorage,
        fallbackAvailable: true,
        details: 'Required for game state persistence'
      },
      {
        name: 'Performance API',
        supported: 'performance' in window,
        fallbackAvailable: true,
        details: 'Used for performance monitoring'
      },
      {
        name: 'WebAssembly',
        supported: 'WebAssembly' in window,
        fallbackAvailable: true,
        details: 'Used for game logic optimization'
      }
    ];

    this.browserInfo.features = features;

    // Check for issues
    features.forEach(feature => {
      if (!feature.supported) {
        this.issues.push({
          feature: feature.name,
          browser: `${this.browserInfo!.name} ${this.browserInfo!.version}`,
          severity: feature.fallbackAvailable ? 'WARNING' : 'CRITICAL',
          message: `${feature.name} is not supported`,
          workaround: feature.fallbackAvailable ? 'Fallback will be used' : 'Feature is required'
        });
      }
    });
  }

  private reportIssues(): void {
    const criticalIssues = this.issues.filter(issue => issue.severity === 'CRITICAL');
    
    if (criticalIssues.length > 0) {
      this.healthService.reportIssue({
        component: 'BrowserCompatibility',
        severity: 'CRITICAL',
        message: `Critical browser compatibility issues detected: ${criticalIssues.map(i => i.message).join(', ')}`
      });
    }
  }

  getBrowserInfo(): BrowserInfo | null {
    return this.browserInfo;
  }

  getIssues(): CompatibilityIssue[] {
    return [...this.issues];
  }

  clearIssues(): void {
    this.issues = [];
  }
} 