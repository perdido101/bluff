import { BrowserCompatibilityService } from './BrowserCompatibilityService';
import { SystemHealthService } from './SystemHealthService';

jest.mock('./SystemHealthService');

describe('BrowserCompatibilityService', () => {
  let service: BrowserCompatibilityService;
  let mockReportIssue: jest.Mock;

  beforeEach(() => {
    // Reset singleton instance
    (BrowserCompatibilityService as any).instance = null;

    // Mock navigator
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        platform: 'Win32'
      },
      writable: true
    });

    // Mock window features
    Object.defineProperty(global, 'WebGLRenderingContext', { value: {} });
    Object.defineProperty(global, 'WebSocket', { value: {} });
    Object.defineProperty(global, 'localStorage', { value: {} });
    Object.defineProperty(global, 'performance', { value: {} });
    Object.defineProperty(global, 'WebAssembly', { value: {} });

    // Mock SystemHealthService
    mockReportIssue = jest.fn();
    (SystemHealthService.getInstance as jest.Mock).mockReturnValue({
      reportIssue: mockReportIssue
    });

    service = BrowserCompatibilityService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.clearIssues();
  });

  it('maintains a singleton instance', () => {
    const instance1 = BrowserCompatibilityService.getInstance();
    const instance2 = BrowserCompatibilityService.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe('browser detection', () => {
    it('detects Chrome browser', () => {
      service.checkCompatibility();
      const info = service.getBrowserInfo();
      expect(info?.name).toBe('Chrome');
      expect(info?.version).toBe('91.0');
    });

    it('detects Firefox browser', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
          platform: 'Win32'
        }
      });
      service.checkCompatibility();
      const info = service.getBrowserInfo();
      expect(info?.name).toBe('Firefox');
      expect(info?.version).toBe('89.0');
    });

    it('detects Safari browser', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
          platform: 'MacIntel'
        }
      });
      service.checkCompatibility();
      const info = service.getBrowserInfo();
      expect(info?.name).toBe('Safari');
      expect(info?.version).toBe('14.1');
    });
  });

  describe('feature detection', () => {
    it('detects supported features', () => {
      service.checkCompatibility();
      const info = service.getBrowserInfo();
      expect(info?.features).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'WebGL', supported: true }),
        expect.objectContaining({ name: 'WebSocket', supported: true }),
        expect.objectContaining({ name: 'LocalStorage', supported: true }),
        expect.objectContaining({ name: 'Performance API', supported: true }),
        expect.objectContaining({ name: 'WebAssembly', supported: true })
      ]));
    });

    it('detects unsupported features', () => {
      // Remove WebGL support
      delete (global as any).WebGLRenderingContext;
      
      service.checkCompatibility();
      const issues = service.getIssues();
      expect(issues).toContainEqual(
        expect.objectContaining({
          feature: 'WebGL',
          severity: 'WARNING',
          message: 'WebGL is not supported'
        })
      );
    });

    it('reports critical issues for required features', () => {
      // Remove WebSocket support (required feature)
      delete (global as any).WebSocket;
      
      service.checkCompatibility();
      expect(mockReportIssue).toHaveBeenCalledWith(expect.objectContaining({
        component: 'BrowserCompatibility',
        severity: 'CRITICAL',
        message: expect.stringContaining('WebSocket is not supported')
      }));
    });
  });

  describe('issue management', () => {
    it('clears issues', () => {
      delete (global as any).WebSocket;
      service.checkCompatibility();
      expect(service.getIssues()).toHaveLength(1);

      service.clearIssues();
      expect(service.getIssues()).toHaveLength(0);
    });

    it('returns a copy of issues array', () => {
      delete (global as any).WebSocket;
      service.checkCompatibility();
      const issues = service.getIssues();
      issues.pop();
      expect(service.getIssues()).toHaveLength(1);
    });
  });
}); 