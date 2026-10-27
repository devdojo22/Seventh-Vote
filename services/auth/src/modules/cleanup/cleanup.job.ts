import type { Logger } from 'pino';
import type { CleanupConfig } from '../../config/environment.js';
import type { CleanupRepository } from './cleanup.repository.js';

/** First run shortly after start-up, so a restart does not postpone cleanup by a whole interval. */
const FIRST_RUN_DELAY_MS = 60_000;

export interface CleanupJob {
  stop(): void;
}

export function startCleanupJob(
  repository: CleanupRepository,
  config: CleanupConfig,
  logger: Logger,
  now: () => Date = () => new Date(),
): CleanupJob {
  const log = logger.child({ job: 'cleanup' });
  let running = false;

  const runOnce = async (): Promise<void> => {
    if (running) return;
    running = true;
    try {
      const counts = await repository.run(now());
      if (counts === null) log.debug('cleanup skipped: another instance holds the lock');
      else log.info({ deleted: counts }, 'cleanup finished');
    } catch (error) {
      log.error({ err: error }, 'cleanup failed');
    } finally {
      running = false;
    }
  };

  const first = setTimeout(() => void runOnce(), FIRST_RUN_DELAY_MS);
  const interval = setInterval(() => void runOnce(), config.intervalMs);
  // Background work must not keep the process alive during shutdown.
  first.unref();
  interval.unref();

  return {
    stop: () => {
      clearTimeout(first);
      clearInterval(interval);
    },
  };
}
