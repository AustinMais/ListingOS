/** Demo access control — "velvet rope" for exclusive beta feel + OpenAI credit protection. */

export const DEMO_COOKIE_NAME = 'listingos_demo_access';
export const DEMO_COOKIE_VALUE = '1';

export function getDemoPassword(): string {
  return process.env.DEMO_PASSWORD ?? 'listingos2025';
}

export function isAuthenticated(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=').trim()];
    })
  );
  return cookies[DEMO_COOKIE_NAME] === DEMO_COOKIE_VALUE;
}
