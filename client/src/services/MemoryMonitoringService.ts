import { SystemHealthService } from './SystemHealthService';

interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  domNodes: number;
  detachedDomNodes: number;
  listeners: number;
}

interface LeakReport {
  type: 'HEAP_GROWTH' | 'DOM_NODES' | 'EVENT_LISTENERS';
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  snapshot: MemorySnapshot;
  trend: number; // Growth rate
}

export class MemoryMonitoringService {
  private static instance: MemoryMonitoringService;
  private healthService: SystemHealthService;
  private snapshots: MemorySnapshot[] = [];
  private readonly MAX_SNAPSHOTS = 100;
  private readonly HEAP_GROWTH_THRESHOLD = 0.1; // 10% growth
  private readonly DOM_NODES_THRESHOLD = 1000;
  private readonly DETACHED_NODES_THRESHOLD = 10;
  private readonly LISTENERS_THRESHOLD = 100;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.healthService = SystemHealthService.getInstance();
  }

  static getInstance(): MemoryMonitoringService {
    if (!MemoryMonitoringService.instance) {
      MemoryMonitoringService.instance = new MemoryMonitoringService();
    }
    return MemoryMonitoringService.instance;
  }

  startMonitoring(intervalMs: number = 5000): void {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot();
      this.analyzeMemory();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private takeSnapshot(): void {
    const performance = window.performance as any;
    const memory = performance?.memory;
    
    if (!memory) {
      console.warn('Memory API not available');
      return;
    }

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      domNodes: this.countDOMNodes(),
      detachedDomNodes: this.countDetachedNodes(),
      listeners: this.countEventListeners()
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }
  }

  private countDOMNodes(): number {
    return document.getElementsByTagName('*').length;
  }

  private countDetachedNodes(): number {
    // This is a simplified check. In a real implementation,
    // you would need a more sophisticated way to track detached nodes
    return 0;
  }

  private countEventListeners(): number {
    // This is a simplified check. In a real implementation,
    // you would need to track event listeners manually
    return 0;
  }

  private analyzeMemory(): LeakReport[] {
    const reports: LeakReport[] = [];
    
    if (this.snapshots.length < 2) {
      return reports;
    }

    const latest = this.snapshots[this.snapshots.length - 1];
    const previous = this.snapshots[this.snapshots.length - 2];

    // Check heap growth
    const heapGrowth = (latest.usedJSHeapSize - previous.usedJSHeapSize) / previous.usedJSHeapSize;
    if (heapGrowth > this.HEAP_GROWTH_THRESHOLD) {
      reports.push({
        type: 'HEAP_GROWTH',
        severity: heapGrowth > this.HEAP_GROWTH_THRESHOLD * 2 ? 'CRITICAL' : 'WARNING',
        message: `Heap grew by ${(heapGrowth * 100).toFixed(1)}% since last snapshot`,
        snapshot: latest,
        trend: heapGrowth
      });
    }

    // Check DOM nodes
    if (latest.domNodes > this.DOM_NODES_THRESHOLD) {
      reports.push({
        type: 'DOM_NODES',
        severity: latest.domNodes > this.DOM_NODES_THRESHOLD * 2 ? 'CRITICAL' : 'WARNING',
        message: `High number of DOM nodes: ${latest.domNodes}`,
        snapshot: latest,
        trend: (latest.domNodes - previous.domNodes) / previous.domNodes
      });
    }

    // Check event listeners
    if (latest.listeners > this.LISTENERS_THRESHOLD) {
      reports.push({
        type: 'EVENT_LISTENERS',
        severity: latest.listeners > this.LISTENERS_THRESHOLD * 2 ? 'CRITICAL' : 'WARNING',
        message: `High number of event listeners: ${latest.listeners}`,
        snapshot: latest,
        trend: (latest.listeners - previous.listeners) / previous.listeners
      });
    }

    // Report to health service if critical issues found
    const criticalReports = reports.filter(r => r.severity === 'CRITICAL');
    if (criticalReports.length > 0) {
      this.healthService.reportIssue({
        component: 'MemoryMonitoring',
        severity: 'CRITICAL',
        message: `Memory issues detected: ${criticalReports.map(r => r.message).join(', ')}`
      });
    }

    return reports;
  }

  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  getLatestSnapshot(): MemorySnapshot | null {
    return this.snapshots[this.snapshots.length - 1] || null;
  }

  clearHistory(): void {
    this.snapshots = [];
  }
} 