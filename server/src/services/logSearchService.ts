import fs from 'fs';
import path from 'path';
import { ErrorLog, RequestLog } from './loggerService';

interface LogSearchParams {
  startDate?: Date;
  endDate?: Date;
  severity?: ('low' | 'medium' | 'high')[];
  path?: string;
  statusCode?: number;
  searchText?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
}

export class LogSearchService {
  constructor(private readonly logDir: string = path.join(__dirname, '../../../logs')) {}

  async searchLogs(params: LogSearchParams): Promise<{
    logs: (ErrorLog | RequestLog)[];
    total: number;
  }> {
    const errorLogs = await this.searchErrorLogs(params);
    const requestLogs = await this.searchRequestLogs(params);

    const combinedLogs = [...errorLogs, ...requestLogs]
      .sort((a, b) => b.timestamp - a.timestamp);

    const total = combinedLogs.length;
    
    if (params.page && params.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      return {
        logs: combinedLogs.slice(start, end),
        total
      };
    }

    return {
      logs: combinedLogs,
      total
    };
  }

  private async searchErrorLogs(params: LogSearchParams): Promise<ErrorLog[]> {
    const errorLogPath = path.join(this.logDir, 'error.log');
    const logs = await this.readLogFile<ErrorLog>(errorLogPath);

    return logs.filter(log => {
      if (params.startDate && log.timestamp < params.startDate.getTime()) return false;
      if (params.endDate && log.timestamp > params.endDate.getTime()) return false;
      if (params.severity && !params.severity.includes(log.severity)) return false;
      if (params.searchText && !this.searchInError(log, params.searchText)) return false;
      return true;
    });
  }

  private async searchRequestLogs(params: LogSearchParams): Promise<RequestLog[]> {
    const requestLogPath = path.join(this.logDir, 'request.log');
    const logs = await this.readLogFile<RequestLog>(requestLogPath);

    return logs.filter(log => {
      if (params.startDate && log.timestamp < params.startDate.getTime()) return false;
      if (params.endDate && log.timestamp > params.endDate.getTime()) return false;
      if (params.path && !log.path.includes(params.path)) return false;
      if (params.statusCode && log.statusCode !== params.statusCode) return false;
      if (params.searchText && !this.searchInRequest(log, params.searchText)) return false;
      return true;
    });
  }

  private async readLogFile<T>(filePath: string): Promise<T[]> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return content
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line));
    } catch (error) {
      console.error(`Error reading log file ${filePath}:`, error);
      return [];
    }
  }

  private searchInError(log: ErrorLog, searchText: string): boolean {
    const searchLower = searchText.toLowerCase();
    return (
      log.error.message?.toLowerCase().includes(searchLower) ||
      log.error.stack?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.context).toLowerCase().includes(searchLower)
    );
  }

  private searchInRequest(log: RequestLog, searchText: string): boolean {
    const searchLower = searchText.toLowerCase();
    return (
      log.path.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.body).toLowerCase().includes(searchLower) ||
      JSON.stringify(log.response).toLowerCase().includes(searchLower)
    );
  }
} 