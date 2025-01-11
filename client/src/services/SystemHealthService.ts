import { PersistenceService } from './persistenceService';

interface SystemMetrics {
  cpu: {
    usage: number;
    temperature: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  network: {
    latency: number;
    activeConnections: number;
    requestsPerMinute: number;
  };
  storage: {
    total: number;
    used: number;
    free: number;
  };
  uptime: number;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: number;
  responseTime: number;
  errorRate: number;
}

interface HealthCheckResult {
  timestamp: number;
  status: 'healthy' | 'degraded' | 'down';
  metrics: SystemMetrics;
  services: ServiceStatus[];
  alerts: Alert[];
}

interface Alert {
  id: string;
  timestamp: number;
  type: 'warning' | 'critical';
  message: string;
  component: string;
  acknowledged: boolean;
}

export class SystemHealthService {
  private static instance: SystemHealthService;
  private persistenceService: PersistenceService;
  private healthHistory: HealthCheckResult[];
  private alerts: Alert[];
  private checkInterval: number;
  private readonly MAX_HISTORY_LENGTH = 1000;

  private constructor() {
    this.persistenceService = new PersistenceService();
    this.healthHistory = [];
    this.alerts = [];
    this.checkInterval = 60000; // 1 minute
    this.loadHistory();
    this.startHealthChecks();
  }

  static getInstance(): SystemHealthService {
    if (!SystemHealthService.instance) {
      SystemHealthService.instance = new SystemHealthService();
    }
    return SystemHealthService.instance;
  }

  private async loadHistory(): Promise<void> {
    try {
      const savedHistory = await this.persistenceService.load('systemHealth');
      if (savedHistory) {
        this.healthHistory = savedHistory;
      }
    } catch (error) {
      console.error('Failed to load system health history:', error);
    }
  }

  private async saveHistory(): Promise<void> {
    try {
      await this.persistenceService.save('systemHealth', this.healthHistory);
    } catch (error) {
      console.error('Failed to save system health history:', error);
    }
  }

  private startHealthChecks(): void {
    setInterval(() => this.performHealthCheck(), this.checkInterval);
  }

  private async performHealthCheck(): Promise<void> {
    const metrics = await this.collectMetrics();
    const services = await this.checkServices();
    const status = this.determineOverallStatus(metrics, services);

    const healthCheck: HealthCheckResult = {
      timestamp: Date.now(),
      status,
      metrics,
      services,
      alerts: this.getActiveAlerts()
    };

    this.healthHistory.unshift(healthCheck);
    if (this.healthHistory.length > this.MAX_HISTORY_LENGTH) {
      this.healthHistory.pop();
    }

    this.saveHistory();
    this.checkForAlerts(healthCheck);
  }

  private async collectMetrics(): Promise<SystemMetrics> {
    // In a real implementation, this would collect actual system metrics
    return {
      cpu: {
        usage: Math.random() * 100,
        temperature: 45 + Math.random() * 20
      },
      memory: {
        total: 16384,
        used: Math.random() * 16384,
        free: Math.random() * 16384
      },
      network: {
        latency: Math.random() * 100,
        activeConnections: Math.floor(Math.random() * 1000),
        requestsPerMinute: Math.floor(Math.random() * 10000)
      },
      storage: {
        total: 1024000,
        used: Math.random() * 1024000,
        free: Math.random() * 1024000
      },
      uptime: process.uptime()
    };
  }

  private async checkServices(): Promise<ServiceStatus[]> {
    // In a real implementation, this would check actual services
    const services = ['database', 'cache', 'auth', 'api'];
    return services.map(name => ({
      name,
      status: Math.random() > 0.9 ? 'degraded' : 'healthy',
      lastCheck: Date.now(),
      responseTime: Math.random() * 1000,
      errorRate: Math.random() * 5
    }));
  }

  private determineOverallStatus(metrics: SystemMetrics, services: ServiceStatus[]): HealthCheckResult['status'] {
    const hasDownService = services.some(s => s.status === 'down');
    if (hasDownService) return 'down';

    const hasDegradedService = services.some(s => s.status === 'degraded');
    const highCpuUsage = metrics.cpu.usage > 90;
    const highMemoryUsage = (metrics.memory.used / metrics.memory.total) > 0.9;
    
    if (hasDegradedService || highCpuUsage || highMemoryUsage) return 'degraded';
    
    return 'healthy';
  }

  private checkForAlerts(health: HealthCheckResult): void {
    // CPU alerts
    if (health.metrics.cpu.usage > 90) {
      this.createAlert('critical', 'High CPU usage detected', 'CPU');
    } else if (health.metrics.cpu.usage > 80) {
      this.createAlert('warning', 'Elevated CPU usage detected', 'CPU');
    }

    // Memory alerts
    const memoryUsage = health.metrics.memory.used / health.metrics.memory.total;
    if (memoryUsage > 0.9) {
      this.createAlert('critical', 'High memory usage detected', 'Memory');
    } else if (memoryUsage > 0.8) {
      this.createAlert('warning', 'Elevated memory usage detected', 'Memory');
    }

    // Service alerts
    health.services.forEach(service => {
      if (service.status === 'down') {
        this.createAlert('critical', `Service ${service.name} is down`, service.name);
      } else if (service.status === 'degraded') {
        this.createAlert('warning', `Service ${service.name} is degraded`, service.name);
      }
    });
  }

  private createAlert(type: Alert['type'], message: string, component: string): void {
    const alert: Alert = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type,
      message,
      component,
      acknowledged: false
    };

    this.alerts.push(alert);
  }

  getHealthHistory(limit: number = 100): HealthCheckResult[] {
    return this.healthHistory.slice(0, limit);
  }

  getCurrentHealth(): HealthCheckResult | null {
    return this.healthHistory[0] || null;
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  setCheckInterval(interval: number): void {
    this.checkInterval = interval;
  }
} 