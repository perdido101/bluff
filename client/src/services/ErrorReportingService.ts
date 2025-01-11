import { PersistenceService } from './persistenceService';

interface ErrorEntry {
  id: string;
  timestamp: number;
  type: string;
  message: string;
  stack?: string;
  component?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'acknowledged' | 'resolved';
}

interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  resolvedErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  averageResolutionTime: number;
}

export class ErrorReportingService {
  private static instance: ErrorReportingService;
  private errors: Map<string, ErrorEntry>;
  private persistenceService: PersistenceService;

  private constructor() {
    this.errors = new Map();
    this.persistenceService = new PersistenceService();
    this.loadErrors();
  }

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  private async loadErrors(): Promise<void> {
    try {
      const savedErrors = await this.persistenceService.load('errors');
      if (savedErrors) {
        this.errors = new Map(Object.entries(savedErrors));
      }
    } catch (error) {
      console.error('Failed to load errors:', error);
    }
  }

  private async saveErrors(): Promise<void> {
    try {
      await this.persistenceService.save('errors', Object.fromEntries(this.errors));
    } catch (error) {
      console.error('Failed to save errors:', error);
    }
  }

  reportError(error: Error, component?: string, severity: ErrorEntry['severity'] = 'medium'): string {
    const id = Date.now().toString();
    const errorEntry: ErrorEntry = {
      id,
      timestamp: Date.now(),
      type: error.name,
      message: error.message,
      stack: error.stack,
      component,
      severity,
      status: 'new'
    };

    this.errors.set(id, errorEntry);
    this.saveErrors();
    return id;
  }

  getError(id: string): ErrorEntry | undefined {
    return this.errors.get(id);
  }

  updateErrorStatus(id: string, status: ErrorEntry['status']): boolean {
    const error = this.errors.get(id);
    if (error) {
      error.status = status;
      this.errors.set(id, error);
      this.saveErrors();
      return true;
    }
    return false;
  }

  getStats(): ErrorStats {
    const stats: ErrorStats = {
      totalErrors: this.errors.size,
      criticalErrors: 0,
      resolvedErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      averageResolutionTime: 0
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    this.errors.forEach(error => {
      // Count by severity
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
      if (error.severity === 'critical') stats.criticalErrors++;

      // Count by type
      stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;

      // Count resolved
      if (error.status === 'resolved') {
        stats.resolvedErrors++;
        resolvedCount++;
        totalResolutionTime += Date.now() - error.timestamp;
      }
    });

    // Calculate average resolution time
    stats.averageResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

    return stats;
  }

  clearResolvedErrors(): void {
    for (const [id, error] of this.errors.entries()) {
      if (error.status === 'resolved') {
        this.errors.delete(id);
      }
    }
    this.saveErrors();
  }

  getRecentErrors(limit: number = 50): ErrorEntry[] {
    return Array.from(this.errors.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
} 