import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { getLogger } from './utils/logger.js';

/**
 * Process entry point: load config, build the app, and start listening.
 * Handles SIGTERM/SIGINT for graceful shutdown in container environments.
 */
function main(): void {
  const config = loadConfig();
  const log = getLogger(config.LOG_LEVEL);
  const app = createApp(config);

  const server = app.listen(config.PORT, () => {
    log.info({ port: config.PORT }, 'orders-api listening');
  });

  const shutdown = (signal: string): void => {
    log.info({ signal }, 'shutting down');
    server.close(() => process.exit(0));
    // Force-exit if connections do not drain in time.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
