import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserCompatibility } from './BrowserCompatibility';
import { BrowserCompatibilityService } from '../services/BrowserCompatibilityService';

jest.mock('../services/BrowserCompatibilityService');

const mockBrowserInfo = {
  name: 'Chrome',
  version: '91.0',
  platform: 'Win32',
  features: [
    {
      name: 'WebGL',
      supported: true,
      fallbackAvailable: true,
      details: 'Required for game graphics'
    },
    {
      name: 'WebSocket',
      supported: false,
      fallbackAvailable: false,
      details: 'Required for real-time communication'
    }
  ],
  timestamp: Date.now()
};

const mockIssues = [
  {
    feature: 'WebSocket',
    browser: 'Chrome 91.0',
    severity: 'CRITICAL' as const,
    message: 'WebSocket is not supported',
    workaround: 'Feature is required'
  }
];

describe('BrowserCompatibility', () => {
  let mockGetInstance: jest.Mock;
  let mockCheckCompatibility: jest.Mock;
  let mockGetBrowserInfo: jest.Mock;
  let mockGetIssues: jest.Mock;

  beforeEach(() => {
    mockCheckCompatibility = jest.fn();
    mockGetBrowserInfo = jest.fn().mockReturnValue(mockBrowserInfo);
    mockGetIssues = jest.fn().mockReturnValue(mockIssues);
    mockGetInstance = jest.fn().mockReturnValue({
      checkCompatibility: mockCheckCompatibility,
      getBrowserInfo: mockGetBrowserInfo,
      getIssues: mockGetIssues
    });

    (BrowserCompatibilityService.getInstance as jest.Mock) = mockGetInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockGetBrowserInfo.mockReturnValueOnce(null);
    render(<BrowserCompatibility />);
    expect(screen.getByText('Loading browser information...')).toBeInTheDocument();
  });

  it('displays browser information', () => {
    render(<BrowserCompatibility />);
    expect(screen.getByText(/Chrome 91.0 on Win32/)).toBeInTheDocument();
  });

  it('displays supported features with correct styling', () => {
    render(<BrowserCompatibility />);
    const webglCard = screen.getByText('WebGL').parentElement;
    expect(webglCard).toHaveStyle({ 'border-left-color': '#4caf50' });
    expect(screen.getByText('✓ Supported')).toBeInTheDocument();
    expect(screen.getByText(/Required for game graphics/)).toBeInTheDocument();
  });

  it('displays unsupported features with correct styling', () => {
    render(<BrowserCompatibility />);
    const websocketCard = screen.getByText('WebSocket').parentElement;
    expect(websocketCard).toHaveStyle({ 'border-left-color': '#ff9800' });
    expect(screen.getByText('✕ Not Supported')).toBeInTheDocument();
    expect(screen.getByText(/Required for real-time communication/)).toBeInTheDocument();
  });

  it('displays compatibility issues', () => {
    render(<BrowserCompatibility />);
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('WebSocket is not supported')).toBeInTheDocument();
    expect(screen.getByText('Feature is required')).toBeInTheDocument();
  });

  it('checks compatibility on mount', () => {
    render(<BrowserCompatibility />);
    expect(mockCheckCompatibility).toHaveBeenCalled();
  });

  it('displays correct browser icon', () => {
    render(<BrowserCompatibility />);
    expect(screen.getByText('🌐')).toBeInTheDocument();

    // Test Firefox icon
    mockGetBrowserInfo.mockReturnValueOnce({
      ...mockBrowserInfo,
      name: 'Firefox'
    });
    render(<BrowserCompatibility />);
    expect(screen.getByText('🦊')).toBeInTheDocument();
  });

  it('handles empty issues list', () => {
    mockGetIssues.mockReturnValueOnce([]);
    render(<BrowserCompatibility />);
    expect(screen.queryByText('CRITICAL')).not.toBeInTheDocument();
  });
}); 