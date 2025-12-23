import pino from 'pino';
import { getConfig } from './config.js';

let loggerInstance: pino.Logger | null = null;

export function createLogger(): pino.Logger {
  const config = getConfig();

  const logger = pino({
    level: config.logLevel,
    formatters: {
      level: (label) => ({ level: label }),
    },
    transport: config.nodeEnv === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  });

  loggerInstance = logger;
  return logger;
}

export function getLogger(): pino.Logger {
  if (!loggerInstance) {
    throw new Error('Logger not initialized. Call createLogger() first.');
  }
  return loggerInstance;
}
