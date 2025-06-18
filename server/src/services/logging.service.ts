import { config } from '../config/env.js';

export interface LogEntry {
  id: string;
  timestamp: string;
  event: string;
  details: string;
}

export class LoggingService {
  private static instance: LoggingService;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;

  private constructor() {}

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  log(event: string, details: string): void {
    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      event,
      details
    };

    this.logs.unshift(logEntry); // Add to beginning of array

    // Keep only the most recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }

    // Also log to console in development
    if (config.env === 'development') {
      console.log(`[${logEntry.timestamp}] ${event}: ${details}`);
    }
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }
} 