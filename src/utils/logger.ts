import type { LogLevel } from '@/types';

/**
 * 简单的结构化日志工具
 */
class Logger {
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseLog = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      return `${baseLog}\n${JSON.stringify(data, null, 2)}`;
    }
    
    return baseLog;
  }

  info(message: string, data?: any) {
    console.log(this.formatMessage('info', message, data));
  }

  warn(message: string, data?: any) {
    console.warn(this.formatMessage('warn', message, data));
  }

  error(message: string, error?: any) {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
    } : error;
    
    console.error(this.formatMessage('error', message, errorData));
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, data));
    }
  }
}

export const logger = new Logger();

