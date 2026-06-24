import pino, { type Logger } from 'pino';

let rootLogger: Logger | null = null;

/**
 * Lazily constructs the process-wide root logger. Keeping a single instance
 * avoids re-parsing transport options on every import.
 */
export function getLogger(level = 'info'): Logger {
  if (!rootLogger) {
    rootLogger = pino({
      level,
      base: { service: 'orders-api' },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }
  return rootLogger;
}

/** Returns a child logger scoped to a named component. */
export function childLogger(component: string): Logger {
  return getLogger().child({ component });
}
