/**
 * SaaS config — deploy-time settings.
 * Set CLIENT_NAME in env to override the display name (default: ListingOS).
 */
export function getClientName(): string {
  return process.env.CLIENT_NAME ?? 'ListingOS';
}
