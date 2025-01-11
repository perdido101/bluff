import { MemoryMonitoringService } from './MemoryMonitoringService';
import { SystemHealthService } from './SystemHealthService';

jest.mock('./SystemHealthService');

describe('MemoryMonitoringService', () => {
  let memoryMonitoringService: MemoryMonitoringService;
  let mockPerformance: any;
  let mockDocument: any;
  let mockReportIssue: jest.Mock;

  beforeEach(() => {
    // Reset singleton instance
    (MemoryMonitoringService as any).instance = null;

    // Mock performance.memory
    mockPerformance = {
      memory: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 200 * 1024 * 1024 // 200MB
      }
    };
    global.performance = mockPerformance;

    // Mock document methods
    mockDocument = {
      getElementsByTagName: jest.fn().mockReturnValue(Array(500))
    };
    global.document = mockDocument;

    // Mock SystemHealthService
    mockReportIssue = jest.fn();
    (SystemHealthService.getInstance as jest.Mock).mockReturnValue({
      reportIssue: mockReportIssue
    });

    memoryMonitoringService = MemoryMonitoringService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
    memoryMonitoringService.stopMonitoring();
    memoryMonitoringService.clearHistory();
  });

  it('maintains a singleton instance', () => {
    const instance1 = MemoryMonitoringService.getInstance();
    const instance2 = MemoryMonitoringService.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe('monitoring', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('starts monitoring at specified interval', () => {
      memoryMonitoringService.startMonitoring(1000);
      
      expect(memoryMonitoringService.getSnapshots()).toHaveLength(0);
      
      jest.advanceTimersByTime(1000);
      expect(memoryMonitoringService.getSnapshots()).toHaveLength(1);
      
      jest.advanceTimersByTime(1000);
      expect(memoryMonitoringService.getSnapshots()).toHaveLength(2);
    });

    it('stops monitoring when requested', () => {
      memoryMonitoringService.startMonitoring(1000);
      jest.advanceTimersByTime(1000);
      expect(memoryMonitoringService.getSnapshots()).toHaveLength(1);

      memoryMonitoringService.stopMonitoring();
      jest.advanceTimersByTime(1000);
      expect(memoryMonitoringService.getSnapshots()).toHaveLength(1);
    });

    it('maintains maximum snapshot history', () => {
      memoryMonitoringService.startMonitoring(100);
      
      // Generate more than MAX_SNAPSHOTS snapshots
      jest.advanceTimersByTime(15000);
      
      expect(memoryMonitoringService.getSnapshots().length).toBeLessThanOrEqual(100);
    });
  });

  describe('memory analysis', () => {
    it('detects heap growth', () => {
      // First snapshot
      memoryMonitoringService.startMonitoring();
      jest.advanceTimersByTime(5000);

      // Simulate heap growth
      mockPerformance.memory.usedJSHeapSize *= 1.2; // 20% increase
      jest.advanceTimersByTime(5000);

      expect(mockReportIssue).toHaveBeenCalledWith(expect.objectContaining({
        component: 'MemoryMonitoring',
        severity: 'CRITICAL',
        message: expect.stringContaining('Memory issues detected')
      }));
    });

    it('detects high DOM node count', () => {
      mockDocument.getElementsByTagName.mockReturnValue(Array(2000)); // Above threshold
      
      memoryMonitoringService.startMonitoring();
      jest.advanceTimersByTime(5000);

      expect(mockReportIssue).toHaveBeenCalledWith(expect.objectContaining({
        component: 'MemoryMonitoring',
        severity: 'CRITICAL',
        message: expect.stringContaining('High number of DOM nodes')
      }));
    });

    it('handles missing performance.memory API', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      delete (global as any).performance.memory;

      memoryMonitoringService.startMonitoring();
      jest.advanceTimersByTime(5000);

      expect(consoleSpy).toHaveBeenCalledWith('Memory API not available');
      consoleSpy.mockRestore();
    });
  });

  describe('snapshot management', () => {
    it('returns latest snapshot', () => {
      expect(memoryMonitoringService.getLatestSnapshot()).toBeNull();

      memoryMonitoringService.startMonitoring();
      jest.advanceTimersByTime(5000);

      const latest = memoryMonitoringService.getLatestSnapshot();
      expect(latest).toBeTruthy();
      expect(latest?.usedJSHeapSize).toBe(mockPerformance.memory.usedJSHeapSize);
    });

    it('clears history', () => {
      memoryMonitoringService.startMonitoring();
      jest.advanceTimersByTime(5000);
      expect(memoryMonitoringService.getSnapshots()).toHaveLength(1);

      memoryMonitoringService.clearHistory();
      expect(memoryMonitoringService.getSnapshots()).toHaveLength(0);
    });
  });
}); 