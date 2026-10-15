import { createApp } from './app.js';
import { ConfigurationError, loadConfig, type AppConfig } from './config/environment.js';
import { createDatabaseHealthCheck, createPrismaRepositories, createServices } from './dependencies.js';
import { createPrismaClient } from './infrastructure/database/prisma.client.js';
import { createLogger } from './infrastructure/logging/logger.js';

function loadConfigOrExit(): AppConfig {
  try {
    return loadConfig();
  } catch (error) {
    if (error instanceof ConfigurationError) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}

const SHUTDOWN_TIMEOUT_MS = 10_000;

const config = loadConfigOrExit();
const logger = createLogger(config.logLevel);
const prisma = createPrismaClient(config.databaseUrl);

const app = createApp({
  config,
  logger,
  services: createServices(config, createPrismaRepositories(prisma)),
  checkDatabase: createDatabaseHealthCheck(prisma),
});

const server = app.listen(config.port, (error?: Error) => {
  if (error) {
    logger.fatal({ err: error }, 'auth service failed to start');
    process.exit(1);
  }
  logger.info({ port: config.port, env: config.nodeEnv }, 'auth service listening');
});

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutting down');
  const forceExit = setTimeout(() => {
    logger.error('graceful shutdown timed out');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close((error) => {
    if (error) logger.error({ err: error }, 'error while closing HTTP server');
    prisma
      .$disconnect()
      .catch((disconnectError: unknown) => {
        logger.error({ err: disconnectError }, 'error while disconnecting from the database');
      })
      .finally(() => {
        process.exit(error ? 1 : 0);
      });
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
