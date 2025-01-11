import { SystemHealthService } from './SystemHealthService';
import { PersistenceService } from './persistenceService';

jest.mock('./persistenceService');

describe('SystemHealthService', () => {
  let healthService: SystemHealthService;
  let mockPersistenceService: jest.Mocked<PersistenceService>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockPersistenceService = {
      load: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue(undefined)
    } as any;

    // Reset singleton instance
    (SystemHealthService as any).instance = null;
    healthService = SystemHealthService.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('maintains a singleton instance', () => {
    const instance1 = SystemHealthService.getInstance();
    const instance2 = SystemHealthService.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe('health checks', () => {
    it('performs health checks at specified intervals', async () => {
      const performHealthCheckSpy = jest.spyOn(
        healthService as any,
        'performHealthCheck'
      );

      // Fast forward 5 minutes
      await act(async () => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      // Should have performed 5 checks (initial + 4 interval checks)
      expect(performHealthCheckSpy).toHaveBeenCalledTimes(5);
    });

    it('collects system metrics', async () => {
      const metrics = await (healthService as any).collectMetrics();

      expect(metrics).toHaveProperty('cpu.usage');
      expect(metrics).toHaveProperty('cpu.temperature');
      expect(metrics).toHaveProperty('memory.total');
      expect(metrics).toHaveProperty('memory.used');
      expect(metrics).toHaveProperty('memory.free');
      expect(metrics).toHaveProperty('network.latency');
      expect(metrics).toHaveProperty('network.activeConnections');
      expect(metrics).toHaveProperty('network.requestsPerMinute');
      expect(metrics).toHaveProperty('storage.total');
      expect(metrics).toHaveProperty('storage.used');
      expect(metrics).toHaveProperty('storage.free');
      expect(metrics).toHaveProperty('uptime');
    });

    it('checks service statuses', async () => {
      const services = await (healthService as any).checkServices();

      expect(services).toHaveLength(4); // database, cache, auth, api
      services.forEach(service => {
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('status');
        expect(service).toHaveProperty('lastCheck');
        expect(service).toHaveProperty('responseTime');
        expect(service).toHaveProperty('errorRate');
      });
    });
  });

  describe('status determination', () => {
    it('returns down status when any service is down', () => {
      const metrics = (healthService as any).collectMetrics();
      const services = [
        { name: 'test', status: 'down', lastCheck: Date.now(), responseTime: 100, errorRate: 0 }
      ];

      const status = (healthService as any).determineOverallStatus(metrics, services);
      expect(status).toBe('down');
    });

    it('returns degraded status for high CPU usage', () => {
      const metrics = {
        cpu: { usage: 95, temperature: 50 },
        memory: { total: 100, used: 50, free: 50 },
        network: { latency: 50, activeConnections: 100, requestsPerMinute: 1000 },
        storage: { total: 1000, used: 500, free: 500 },
        uptime: 1000
      };
      const services = [
        { name: 'test', status: 'healthy', lastCheck: Date.now(), responseTime: 100, errorRate: 0 }
      ];

      const status = (healthService as any).determineOverallStatus(metrics, services);
      expect(status).toBe('degraded');
    });

    it('returns healthy status when all checks pass', () => {
      const metrics = {
        cpu: { usage: 50, temperature: 50 },
        memory: { total: 100, used: 50, free: 50 },
        network: { latency: 50, activeConnections: 100, requestsPerMinute: 1000 },
        storage: { total: 1000, used: 500, free: 500 },
        uptime: 1000
      };
      const services = [
        { name: 'test', status: 'healthy', lastCheck: Date.now(), responseTime: 100, errorRate: 0 }
      ];

      const status = (healthService as any).determineOverallStatus(metrics, services);
      expect(status).toBe('healthy');
    });
  });

  describe('alerts', () => {
    it('creates alerts for high CPU usage', () => {
      const health = {
        metrics: {
          cpu: { usage: 95, temperature: 50 },
          memory: { total: 100, used: 50, free: 50 },
          network: { latency: 50, activeConnections: 100, requestsPerMinute: 1000 },
          storage: { total: 1000, used: 500, free: 500 },
          uptime: 1000
        },
        services: []
      };

      (healthService as any).checkForAlerts(health);
      const alerts = healthService.getActiveAlerts();

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('critical');
      expect(alerts[0].component).toBe('CPU');
    });

    it('creates alerts for degraded services', () => {
      const health = {
        metrics: {
          cpu: { usage: 50, temperature: 50 },
          memory: { total: 100, used: 50, free: 50 },
          network: { latency: 50, activeConnections: 100, requestsPerMinute: 1000 },
          storage: { total: 1000, used: 500, free: 500 },
          uptime: 1000
        },
        services: [
          { name: 'test', status: 'degraded', lastCheck: Date.now(), responseTime: 100, errorRate: 0 }
        ]
      };

      (healthService as any).checkForAlerts(health);
      const alerts = healthService.getActiveAlerts();

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('warning');
      expect(alerts[0].component).toBe('test');
    });

    it('acknowledges alerts correctly', () => {
      const health = {
        metrics: {
          cpu: { usage: 95, temperature: 50 },
          memory: { total: 100, used: 50, free: 50 },
          network: { latency: 50, activeConnections: 100, requestsPerMinute: 1000 },
          storage: { total: 1000, used: 500, free: 500 },
          uptime: 1000
        },
        services: []
      };

      (healthService as any).checkForAlerts(health);
      const alerts = healthService.getActiveAlerts();
      const alertId = alerts[0].id;

      expect(healthService.acknowledgeAlert(alertId)).toBe(true);
      expect(healthService.getActiveAlerts()).toHaveLength(0);
    });
  });

  describe('history management', () => {
    it('maintains history within size limit', async () => {
      // Simulate many health checks
      for (let i = 0; i < 1100; i++) {
        await (healthService as any).performHealthCheck();
      }

      const history = healthService.getHealthHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
    });

    it('returns most recent health check first', async () => {
      await (healthService as any).performHealthCheck();
      jest.advanceTimersByTime(1000);
      await (healthService as any).performHealthCheck();

      const history = healthService.getHealthHistory();
      expect(history[0].timestamp).toBeGreaterThan(history[1].timestamp);
    });
  });
}); 