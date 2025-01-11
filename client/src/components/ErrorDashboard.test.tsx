import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ErrorDashboard } from './ErrorDashboard';
import { ErrorReportingService } from '../services/ErrorReportingService';

jest.mock('../services/ErrorReportingService');

describe('ErrorDashboard', () => {
  const mockStats = {
    totalErrors: 10,
    criticalErrors: 2,
    resolvedErrors: 3,
    averageResolutionTime: 300000, // 5 minutes
    errorsByType: { TypeError: 5, ReferenceError: 5 },
    errorsBySeverity: { critical: 2, high: 3, medium: 3, low: 2 }
  };

  const mockErrors = [
    {
      id: '1',
      timestamp: Date.now(),
      type: 'TypeError',
      message: 'Critical error',
      component: 'Component1',
      severity: 'critical',
      status: 'new'
    },
    {
      id: '2',
      timestamp: Date.now() - 1000,
      type: 'ReferenceError',
      message: 'High priority error',
      component: 'Component2',
      severity: 'high',
      status: 'acknowledged'
    },
    {
      id: '3',
      timestamp: Date.now() - 2000,
      type: 'TypeError',
      message: 'Resolved error',
      component: 'Component1',
      severity: 'medium',
      status: 'resolved'
    }
  ];

  let mockErrorService: jest.Mocked<ErrorReportingService>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockErrorService = {
      getInstance: jest.fn().mockReturnThis(),
      getStats: jest.fn().mockReturnValue(mockStats),
      getRecentErrors: jest.fn().mockReturnValue(mockErrors),
      updateErrorStatus: jest.fn(),
      clearResolvedErrors: jest.fn()
    } as any;

    (ErrorReportingService.getInstance as jest.Mock).mockReturnValue(
      mockErrorService
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders error statistics correctly', () => {
    render(<ErrorDashboard />);

    expect(screen.getByText('Total Errors')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    expect(screen.getByText('Critical Errors')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText('Resolved')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    expect(screen.getByText('Avg. Resolution Time')).toBeInTheDocument();
    expect(screen.getByText('5 min')).toBeInTheDocument();
  });

  it('renders error list with correct status badges', () => {
    render(<ErrorDashboard />);

    expect(screen.getByText('NEW')).toBeInTheDocument();
    expect(screen.getByText('ACKNOWLEDGED')).toBeInTheDocument();
    expect(screen.getByText('RESOLVED')).toBeInTheDocument();
  });

  it('shows correct action buttons based on error status', () => {
    render(<ErrorDashboard />);

    // New error should have "Acknowledge" button
    expect(screen.getByText('Acknowledge')).toBeInTheDocument();

    // Acknowledged error should have "Resolve" button
    expect(screen.getByText('Resolve')).toBeInTheDocument();

    // Resolved error should have no action buttons
    const resolvedError = mockErrors.find(e => e.status === 'resolved');
    const resolvedErrorElement = screen.getByText(resolvedError!.message);
    const resolvedErrorActions = resolvedErrorElement.parentElement?.querySelector('button');
    expect(resolvedErrorActions).toBeNull();
  });

  it('updates error status when action buttons are clicked', () => {
    render(<ErrorDashboard />);

    // Click "Acknowledge" button
    fireEvent.click(screen.getByText('Acknowledge'));
    expect(mockErrorService.updateErrorStatus).toHaveBeenCalledWith('1', 'acknowledged');

    // Click "Resolve" button
    fireEvent.click(screen.getByText('Resolve'));
    expect(mockErrorService.updateErrorStatus).toHaveBeenCalledWith('2', 'resolved');
  });

  it('clears resolved errors when clear button is clicked', () => {
    render(<ErrorDashboard />);

    fireEvent.click(screen.getByText('Clear Resolved'));
    expect(mockErrorService.clearResolvedErrors).toHaveBeenCalled();
  });

  it('updates dashboard automatically every 5 seconds', () => {
    render(<ErrorDashboard />);

    expect(mockErrorService.getStats).toHaveBeenCalledTimes(1);
    expect(mockErrorService.getRecentErrors).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockErrorService.getStats).toHaveBeenCalledTimes(2);
    expect(mockErrorService.getRecentErrors).toHaveBeenCalledTimes(2);
  });

  it('displays error components correctly', () => {
    render(<ErrorDashboard />);

    expect(screen.getByText('Component1')).toBeInTheDocument();
    expect(screen.getByText('Component2')).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    render(<ErrorDashboard />);

    mockErrors.forEach(error => {
      const formattedTime = new Date(error.timestamp).toLocaleString();
      expect(screen.getByText(formattedTime)).toBeInTheDocument();
    });
  });

  it('highlights critical errors with different background', () => {
    const { container } = render(<ErrorDashboard />);
    
    const criticalError = container.querySelector('div[severity="critical"]');
    expect(criticalError).toHaveStyle({ background: 'rgba(244, 67, 54, 0.1)' });
  });

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    const { unmount } = render(<ErrorDashboard />);
    
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
}); 