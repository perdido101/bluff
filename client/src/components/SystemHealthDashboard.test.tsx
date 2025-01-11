import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SystemHealthDashboard } from './SystemHealthDashboard';
import { SystemHealthService } from '../services/SystemHealthService';

jest.mock('../services/SystemHealthService');

const mockHealth = {
  status: 'healthy',
  metrics: {
    cpu: { usage: 45, temperature: 50 },
    memory: {
      total: 16 * 1024 * 1024,
      used: 8 * 1024 * 1024,
      free: 8 * 1024 * 1024
    },
    network: {
      latency: 50,
      activeConnections: 100,
      requestsPerMinute: 1000
    },
    storage: {
      total: 1000,
      used: 500,
      free: 500
    },
    uptime: 86400 * 2 + 3600 * 5 + 60 * 30 // 2 days, 5 hours, 30 minutes
  },
  services: [
    {
      name: 'database',
      status: 'healthy',
      responseTime: 50,
      errorRate: 0,
      lastCheck: new Date().toISOString()
    },
    {
      name: 'cache',
      status: 'degraded',
      responseTime: 150,
      errorRate: 5,
      lastCheck: new Date().toISOString()
    }
  ]
};

const mockAlerts = [
  {
    id: '1',
    type: 'critical',
    component: 'CPU',
    message: 'High CPU usage detected',
    timestamp: new Date().toISOString()
  },
  {
    id: '2',
    type: 'warning',
    component: 'Cache',
    message: 'Degraded performance',
    timestamp: new Date().toISOString()
  }
];

describe('SystemHealthDashboard', () => {
  let mockGetCurrentHealth: jest.Mock;
  let mockGetActiveAlerts: jest.Mock;
  let mockAcknowledgeAlert: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockGetCurrentHealth = jest.fn().mockResolvedValue(mockHealth);
    mockGetActiveAlerts = jest.fn().mockReturnValue(mockAlerts);
    mockAcknowledgeAlert = jest.fn().mockReturnValue(true);

    (SystemHealthService.getInstance as jest.Mock).mockReturnValue({
      getCurrentHealth: mockGetCurrentHealth,
      getActiveAlerts: mockGetActiveAlerts,
      acknowledgeAlert: mockAcknowledgeAlert
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<SystemHealthDashboard />);
    expect(screen.queryByText('System Health')).not.toBeInTheDocument();
  });

  it('renders system status correctly', async () => {
    render(<SystemHealthDashboard />);
    await screen.findByText('System Health');
    expect(screen.getByText('HEALTHY')).toBeInTheDocument();
  });

  it('displays all metric cards', async () => {
    render(<SystemHealthDashboard />);
    await screen.findByText('System Health');

    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();

    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('8 GB')).toBeInTheDocument();

    expect(screen.getByText('Network Latency')).toBeInTheDocument();
    expect(screen.getByText('50ms')).toBeInTheDocument();

    expect(screen.getByText('Uptime')).toBeInTheDocument();
    expect(screen.getByText('2d 5h 30m')).toBeInTheDocument();
  });

  it('displays services table with correct data', async () => {
    render(<SystemHealthDashboard />);
    await screen.findByText('System Health');

    expect(screen.getByText('database')).toBeInTheDocument();
    expect(screen.getByText('cache')).toBeInTheDocument();
    expect(screen.getAllByText('HEALTHY')[0]).toBeInTheDocument();
    expect(screen.getByText('DEGRADED')).toBeInTheDocument();
  });

  it('displays active alerts', async () => {
    render(<SystemHealthDashboard />);
    await screen.findByText('Active Alerts');

    expect(screen.getByText('High CPU usage detected')).toBeInTheDocument();
    expect(screen.getByText('Degraded performance')).toBeInTheDocument();
  });

  it('handles alert acknowledgment', async () => {
    render(<SystemHealthDashboard />);
    await screen.findByText('Active Alerts');

    const acknowledgeButtons = screen.getAllByText('Acknowledge');
    fireEvent.click(acknowledgeButtons[0]);

    expect(mockAcknowledgeAlert).toHaveBeenCalledWith('1');
    expect(mockGetActiveAlerts).toHaveBeenCalled();
  });

  it('updates data every 5 seconds', async () => {
    render(<SystemHealthDashboard />);
    await screen.findByText('System Health');

    expect(mockGetCurrentHealth).toHaveBeenCalledTimes(1);
    expect(mockGetActiveAlerts).toHaveBeenCalledTimes(1);

    // Fast forward 5 seconds
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockGetCurrentHealth).toHaveBeenCalledTimes(2);
    expect(mockGetActiveAlerts).toHaveBeenCalledTimes(2);
  });

  it('cleans up interval on unmount', async () => {
    const { unmount } = render(<SystemHealthDashboard />);
    await screen.findByText('System Health');

    unmount();

    // Fast forward 5 seconds
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockGetCurrentHealth).toHaveBeenCalledTimes(1);
  });

  it('shows alert styling for high CPU usage', async () => {
    const highCpuHealth = {
      ...mockHealth,
      metrics: {
        ...mockHealth.metrics,
        cpu: { usage: 95, temperature: 50 }
      }
    };
    mockGetCurrentHealth.mockResolvedValueOnce(highCpuHealth);

    render(<SystemHealthDashboard />);
    await screen.findByText('95%');

    const cpuValue = screen.getByText('95%');
    expect(cpuValue).toHaveStyle({ color: '#f44336' });
  });

  it('shows alert styling for high memory usage', async () => {
    const highMemoryHealth = {
      ...mockHealth,
      metrics: {
        ...mockHealth.metrics,
        memory: {
          total: 16 * 1024 * 1024,
          used: 15 * 1024 * 1024,
          free: 1 * 1024 * 1024
        }
      }
    };
    mockGetCurrentHealth.mockResolvedValueOnce(highMemoryHealth);

    render(<SystemHealthDashboard />);
    await screen.findByText('15 GB');

    const memoryValue = screen.getByText('15 GB');
    expect(memoryValue).toHaveStyle({ color: '#f44336' });
  });

  it('shows alert styling for high network latency', async () => {
    const highLatencyHealth = {
      ...mockHealth,
      metrics: {
        ...mockHealth.metrics,
        network: {
          latency: 1500,
          activeConnections: 100,
          requestsPerMinute: 1000
        }
      }
    };
    mockGetCurrentHealth.mockResolvedValueOnce(highLatencyHealth);

    render(<SystemHealthDashboard />);
    await screen.findByText('1,500ms');

    const latencyValue = screen.getByText('1,500ms');
    expect(latencyValue).toHaveStyle({ color: '#f44336' });
  });
}); 