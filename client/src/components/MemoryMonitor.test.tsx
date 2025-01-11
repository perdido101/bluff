import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryMonitor } from './MemoryMonitor';
import { MemoryMonitoringService } from '../services/MemoryMonitoringService';

jest.mock('../services/MemoryMonitoringService');

const mockSnapshot = {
  timestamp: Date.now(),
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
  domNodes: 500,
  detachedDomNodes: 0,
  listeners: 50
};

describe('MemoryMonitor', () => {
  let mockGetInstance: jest.Mock;
  let mockStartMonitoring: jest.Mock;
  let mockStopMonitoring: jest.Mock;
  let mockGetLatestSnapshot: jest.Mock;
  let mockClearHistory: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockStartMonitoring = jest.fn();
    mockStopMonitoring = jest.fn();
    mockGetLatestSnapshot = jest.fn().mockReturnValue(mockSnapshot);
    mockClearHistory = jest.fn();
    mockGetInstance = jest.fn().mockReturnValue({
      startMonitoring: mockStartMonitoring,
      stopMonitoring: mockStopMonitoring,
      getLatestSnapshot: mockGetLatestSnapshot,
      clearHistory: mockClearHistory
    });

    (MemoryMonitoringService.getInstance as jest.Mock) = mockGetInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders initial state correctly', () => {
    render(<MemoryMonitor />);

    expect(screen.getByText('Memory Monitor')).toBeInTheDocument();
    expect(screen.getByText('Start Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Clear Data')).toBeInTheDocument();
  });

  it('starts monitoring when start button is clicked', () => {
    render(<MemoryMonitor />);

    fireEvent.click(screen.getByText('Start Monitoring'));

    expect(mockStartMonitoring).toHaveBeenCalled();
    expect(screen.getByText('Stop Monitoring')).toBeInTheDocument();
  });

  it('stops monitoring when stop button is clicked', () => {
    render(<MemoryMonitor />);

    fireEvent.click(screen.getByText('Start Monitoring'));
    fireEvent.click(screen.getByText('Stop Monitoring'));

    expect(mockStopMonitoring).toHaveBeenCalled();
    expect(screen.getByText('Start Monitoring')).toBeInTheDocument();
  });

  it('clears data when clear button is clicked', () => {
    render(<MemoryMonitor />);

    fireEvent.click(screen.getByText('Clear Data'));

    expect(mockClearHistory).toHaveBeenCalled();
  });

  it('updates metrics periodically when monitoring', async () => {
    render(<MemoryMonitor />);

    fireEvent.click(screen.getByText('Start Monitoring'));

    // Fast forward 1 second
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockGetLatestSnapshot).toHaveBeenCalled();
    expect(screen.getByText('50.0 MB')).toBeInTheDocument(); // Used Heap
    expect(screen.getByText('100.0 MB')).toBeInTheDocument(); // Total Heap
    expect(screen.getByText('200.0 MB')).toBeInTheDocument(); // Heap Limit
    expect(screen.getByText('500')).toBeInTheDocument(); // DOM Nodes
    expect(screen.getByText('0')).toBeInTheDocument(); // Detached Nodes
    expect(screen.getByText('50')).toBeInTheDocument(); // Event Listeners
  });

  it('shows alerts for concerning metrics', async () => {
    const highUsageSnapshot = {
      ...mockSnapshot,
      usedJSHeapSize: 90 * 1024 * 1024, // 90% of total
      domNodes: 1500, // Above threshold
      detachedDomNodes: 5, // Above 0
      listeners: 150 // Above threshold
    };
    mockGetLatestSnapshot.mockReturnValue(highUsageSnapshot);

    render(<MemoryMonitor />);
    fireEvent.click(screen.getByText('Start Monitoring'));

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    const alertValues = screen.getAllByText((content, element) => {
      return element?.getAttribute('color') === '#f44336';
    });
    expect(alertValues).toHaveLength(4); // Used Heap, DOM Nodes, Detached Nodes, Listeners
  });

  it('stops updating when unmounted', async () => {
    const { unmount } = render(<MemoryMonitor />);

    fireEvent.click(screen.getByText('Start Monitoring'));
    unmount();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockStopMonitoring).toHaveBeenCalled();
  });

  it('formats bytes correctly', () => {
    render(<MemoryMonitor />);

    fireEvent.click(screen.getByText('Start Monitoring'));

    expect(screen.getByText('50.0 MB')).toBeInTheDocument();
    expect(screen.getByText('100.0 MB')).toBeInTheDocument();
    expect(screen.getByText('200.0 MB')).toBeInTheDocument();
  });
}); 