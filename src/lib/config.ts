/**
 * SaaS config — client name and other deploy-time settings.
 * Set CLIENT_NAME in env (e.g. "Austin Mais") to customize for each client.
 */
export function getClientName(): string {
  return process.env.CLIENT_NAME ?? 'Austin Mais';
}
