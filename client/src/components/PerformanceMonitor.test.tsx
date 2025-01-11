import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PerformanceMonitor } from './PerformanceMonitor';
import { PerformanceOptimizationService } from '../services/PerformanceOptimizationService';

jest.mock('../services/PerformanceOptimizationService');

describe('PerformanceMonitor', () => {
  const mockMetrics = {
    cacheHits: 150,
    cacheMisses: 50,
    averageProcessingTime: 120,
    totalProcessed: 200,
    cacheHitRate: 0.75
  };

  let mockPerformanceService: jest.Mocked<PerformanceOptimizationService>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockPerformanceService = {
      getInstance: jest.fn().mockReturnThis(),
      getMetrics: jest.fn().mockReturnValue(mockMetrics)
    } as any;

    (PerformanceOptimizationService.getInstance as jest.Mock).mockReturnValue(
      mockPerformanceService
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders all metric cards with correct values', () => {
    render(<PerformanceMonitor />);

    expect(screen.getByText('Cache Hit Rate')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();

    expect(screen.getByText('Cache Hits')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();

    expect(screen.getByText('Cache Misses')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();

    expect(screen.getByText('Avg. Processing Time')).toBeInTheDocument();
    expect(screen.getByText('120ms')).toBeInTheDocument();

    expect(screen.getByText('Total Processed')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('updates metrics when refresh button is clicked', () => {
    render(<PerformanceMonitor />);

    const updatedMetrics = {
      ...mockMetrics,
      cacheHits: 200,
      totalProcessed: 250
    };

    mockPerformanceService.getMetrics.mockReturnValueOnce(updatedMetrics);

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
  });

  it('updates metrics automatically every 5 seconds', () => {
    render(<PerformanceMonitor />);

    const updatedMetrics = {
      ...mockMetrics,
      cacheHits: 300,
      totalProcessed: 400
    };

    mockPerformanceService.getMetrics.mockReturnValueOnce(updatedMetrics);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
  });

  it('displays correct colors for cache hit rate', () => {
    const testCases = [
      { rate: 0.85, color: '#4CAF50' }, // Green for ≥ 80%
      { rate: 0.65, color: '#FFC107' }, // Yellow for ≥ 60%
      { rate: 0.45, color: '#f44336' }  // Red for < 60%
    ];

    testCases.forEach(({ rate, color }) => {
      mockPerformanceService.getMetrics.mockReturnValueOnce({
        ...mockMetrics,
        cacheHitRate: rate
      });

      const { container } = render(<PerformanceMonitor />);
      const rateElement = container.querySelector(`span[color="${color}"]`);
      expect(rateElement).toBeInTheDocument();
    });
  });

  it('displays correct colors for processing time', () => {
    const testCases = [
      { time: 90, color: '#4CAF50' },  // Green for ≤ 100ms
      { time: 200, color: '#FFC107' }, // Yellow for ≤ 300ms
      { time: 400, color: '#f44336' }  // Red for > 300ms
    ];

    testCases.forEach(({ time, color }) => {
      mockPerformanceService.getMetrics.mockReturnValueOnce({
        ...mockMetrics,
        averageProcessingTime: time
      });

      const { container } = render(<PerformanceMonitor />);
      const timeElement = container.querySelector(`span[color="${color}"]`);
      expect(timeElement).toBeInTheDocument();
    });
  });

  it('cleans up interval on unmount', () => {
    const { unmount } = render(<PerformanceMonitor />);
    
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('formats large numbers correctly', () => {
    mockPerformanceService.getMetrics.mockReturnValueOnce({
      ...mockMetrics,
      cacheHits: 1234567,
      totalProcessed: 9876543
    });

    render(<PerformanceMonitor />);

    expect(screen.getByText('1,234,567')).toBeInTheDocument();
    expect(screen.getByText('9,876,543')).toBeInTheDocument();
  });
}); 