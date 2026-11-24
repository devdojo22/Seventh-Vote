import { canRetrySimulation, describeSimulationError } from './simulation-errors';

/** A failed simulation request, as the Session and Prep pages show it. */
export interface SimulationErrorStatus {
  state: 'error';
  message: string;
  retryable: boolean;
}

export function simulationErrorStatus(error: unknown): SimulationErrorStatus {
  return {
    state: 'error',
    message: describeSimulationError(error),
    retryable: canRetrySimulation(error),
  };
}

interface Outcome<T> {
  onDone: (value: T) => void;
  onError: (error: unknown) => void;
}

export interface LatestRequest {
  abort: () => void;
  run: <T>(request: (signal: AbortSignal) => Promise<T>, outcome: Outcome<T>) => Promise<void>;
}

export function latestRequest(): LatestRequest {
  let inFlight: AbortController | null = null;

  function abort(): void {
    inFlight?.abort();
    inFlight = null;
  }

  async function run<T>(
    request: (signal: AbortSignal) => Promise<T>,
    { onDone, onError }: Outcome<T>,
  ): Promise<void> {
    abort();
    const controller = new AbortController();
    inFlight = controller;
    try {
      const value = await request(controller.signal);
      if (inFlight === controller) onDone(value);
    } catch (error) {
      if (inFlight === controller) onError(error);
    } finally {
      if (inFlight === controller) inFlight = null;
    }
  }

  return { abort, run };
}
