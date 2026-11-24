import { describeAccessError } from '@/features/access/access-errors';
import { serverValidationIssues } from '@/features/dossiers/dossier-errors';
import { ApiError, ResponseContractError } from '@/lib/api/http';

export function isLlmNotConfigured(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'llm_not_configured';
}

export function describeSimulationError(error: unknown): string {
  if (isLlmNotConfigured(error)) {
    return 'AI simulation isn’t set up on this server yet. Ask your administrator to add the AI key.';
  }
  if (error instanceof ApiError && error.code === 'simulation_failed') {
    return 'The AI simulation didn’t finish. Try again in a moment.';
  }
  if (error instanceof ResponseContractError) {
    return 'The simulation returned an answer this page can’t read. Try again in a moment.';
  }
  const validationMessage = serverValidationIssues(error)[0]?.message;
  if (validationMessage) return validationMessage;
  return describeAccessError(error);
}

export function canRetrySimulation(error: unknown): boolean {
  if (isLlmNotConfigured(error)) return false;
  return !(error instanceof ApiError && [400, 401, 403].includes(error.status));
}
