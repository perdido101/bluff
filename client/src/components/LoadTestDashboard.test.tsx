import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LoadTestDashboard } from './LoadTestDashboard';
import { LoadTestingService } from '../services/LoadTestingService';

jest.mock('../services/LoadTestingService');

const mockSummary = {
  startTime: new Date().getTime(),
  endTime: new Date().getTime() + 5000,
  totalRequests: 100,
  successfulRequests: 95,
  failedRequests: 5,
  errorRate: 5,
  averageResponseTime: 500,
  p95ResponseTime: 1500,
  p99ResponseTime: 2500,
  config: {
    concurrentUsers: 10,
    rampUpTime: 5,
    testDuration: 30,
    requestsPerUser: 10,
    targetEndpoints: ['http://test.com/api']
  }
};

describe('LoadTestDashboard', () => {
  let mockGetInstance: jest.Mock;
  let mockStartLoadTest: jest.Mock;
  let mockGetAllTestSummaries: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockStartLoadTest = jest.fn().mockResolvedValue('test-id');
    mockGetAllTestSummaries = jest.fn().mockReturnValue([mockSummary]);
    mockGetInstance = jest.fn().mockReturnValue({
      startLoadTest: mockStartLoadTest,
      getAllTestSummaries: mockGetAllTestSummaries
    });

    (LoadTestingService.getInstance as jest.Mock) = mockGetInstance;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders the form with initial values', () => {
    render(<LoadTestDashboard />);

    expect(screen.getByLabelText(/concurrent users/i)).toHaveValue(10);
    expect(screen.getByLabelText(/ramp up time/i)).toHaveValue(5);
    expect(screen.getByLabelText(/test duration/i)).toHaveValue(30);
    expect(screen.getByLabelText(/requests per user/i)).toHaveValue(5);
    expect(screen.getByLabelText(/target endpoints/i)).toHaveValue('');
  });

  it('updates form values on input change', () => {
    render(<LoadTestDashboard />);

    const concurrentUsersInput = screen.getByLabelText(/concurrent users/i);
    fireEvent.change(concurrentUsersInput, { target: { value: '20' } });
    expect(concurrentUsersInput).toHaveValue(20);

    const targetEndpointsInput = screen.getByLabelText(/target endpoints/i);
    fireEvent.change(targetEndpointsInput, { 
      target: { value: 'http://test.com/api' } 
    });
    expect(targetEndpointsInput).toHaveValue('http://test.com/api');
  });

  it('submits the form with correct values', async () => {
    render(<LoadTestDashboard />);

    fireEvent.change(screen.getByLabelText(/target endpoints/i), {
      target: { value: 'http://test.com/api1, http://test.com/api2' }
    });

    fireEvent.submit(screen.getByRole('button', { name: /start test/i }));

    expect(mockStartLoadTest).toHaveBeenCalledWith({
      concurrentUsers: 10,
      rampUpTime: 5,
      testDuration: 30,
      requestsPerUser: 5,
      targetEndpoints: ['http://test.com/api1', 'http://test.com/api2']
    });
  });

  it('disables submit button while test is running', async () => {
    render(<LoadTestDashboard />);

    const submitButton = screen.getByRole('button', { name: /start test/i });
    fireEvent.submit(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/running test/i);

    // Wait for test completion
    await act(async () => {
      await mockStartLoadTest();
    });

    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveTextContent(/start test/i);
  });

  it('displays test summaries', async () => {
    render(<LoadTestDashboard />);

    expect(screen.getByText('100')).toBeInTheDocument(); // Total Requests
    expect(screen.getByText('95.0%')).toBeInTheDocument(); // Success Rate
    expect(screen.getByText('500ms')).toBeInTheDocument(); // Avg Response Time
    expect(screen.getByText('1,500ms')).toBeInTheDocument(); // P95
    expect(screen.getByText('2,500ms')).toBeInTheDocument(); // P99
    expect(screen.getByText('10')).toBeInTheDocument(); // Concurrent Users
  });

  it('updates summaries periodically', async () => {
    render(<LoadTestDashboard />);

    expect(mockGetAllTestSummaries).toHaveBeenCalledTimes(1);

    // Fast forward 1 second
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockGetAllTestSummaries).toHaveBeenCalledTimes(2);
  });

  it('cleans up interval on unmount', async () => {
    const { unmount } = render(<LoadTestDashboard />);

    expect(mockGetAllTestSummaries).toHaveBeenCalledTimes(1);

    unmount();

    // Fast forward 1 second
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockGetAllTestSummaries).toHaveBeenCalledTimes(1);
  });

  it('shows alert styling for high error rate', () => {
    const highErrorSummary = {
      ...mockSummary,
      errorRate: 10
    };
    mockGetAllTestSummaries.mockReturnValueOnce([highErrorSummary]);

    render(<LoadTestDashboard />);

    const successRate = screen.getByText('90.0%');
    expect(successRate).toHaveStyle({ color: '#f44336' });
  });

  it('shows alert styling for high response times', () => {
    const highLatencySummary = {
      ...mockSummary,
      averageResponseTime: 1500,
      p95ResponseTime: 2500,
      p99ResponseTime: 3500
    };
    mockGetAllTestSummaries.mockReturnValueOnce([highLatencySummary]);

    render(<LoadTestDashboard />);

    const avgResponseTime = screen.getByText('1,500ms');
    const p95ResponseTime = screen.getByText('2,500ms');
    const p99ResponseTime = screen.getByText('3,500ms');

    expect(avgResponseTime).toHaveStyle({ color: '#f44336' });
    expect(p95ResponseTime).toHaveStyle({ color: '#f44336' });
    expect(p99ResponseTime).toHaveStyle({ color: '#f44336' });
  });
}); 