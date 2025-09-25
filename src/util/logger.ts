import { format } from 'node:util';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const envLevel = (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info';
const minLevel = levelOrder[envLevel] ?? levelOrder.info;

function log(level: LogLevel, message: unknown, ...args: unknown[]): void {
  if (levelOrder[level] < minLevel) {
    return;
  }

  const timestamp = new Date().toISOString();
  const rendered = typeof message === 'string' ? format(message, ...args) : format('%o', message);
  const payload = `${timestamp} [${level.toUpperCase()}] ${rendered}`;

  if (level === 'error') {
    console.error(payload);
  } else if (level === 'warn') {
    console.warn(payload);
  } else {
    console.log(payload);
  }
}

export const logger = {
  debug: (message: unknown, ...args: unknown[]) => log('debug', message, ...args),
  info: (message: unknown, ...args: unknown[]) => log('info', message, ...args),
  warn: (message: unknown, ...args: unknown[]) => log('warn', message, ...args),
  error: (message: unknown, ...args: unknown[]) => log('error', message, ...args),
};

export type Logger = typeof logger;
