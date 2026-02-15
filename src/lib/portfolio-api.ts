/**
 * Portfolio API client — discovery + multi-endpoint fetch for portfolio/consulting sites.
 * GET /api returns index with endpoints; then we fetch the paths needed for assistant context.
 */

const CACHE_REVALIDATE_SECONDS = 300; // 5 minutes

export type PortfolioDiscovery = {
  baseUrl: string;
  endpoints: Array<{ path: string; description: string }>;
};

/** Portfolio API base URL from env (e.g. http://localhost:3000). All endpoints are built from this + /api/.... */
export function getPortfolioBaseUrl(): string {
  const base = process.env.PORTFOLIO_BASE_URL;
  if (!base) {
    throw new Error(
      'PORTFOLIO_BASE_URL is not set. Set it to your portfolio API base URL (e.g. http://localhost:3000)'
    );
  }
  return base.trim().replace(/\/$/, '').replace(/\/api\/?$/, '');
}

/** Ensure base has no trailing /api so that base + "/api/contact" does not become .../api/api/contact. */
function normalizeBaseUrl(base: string): string {
  return base.replace(/\/api\/?$/, '') || base;
}

/** Fetch GET /api for discovery (baseUrl + endpoints). */
export async function fetchDiscovery(
  baseUrl?: string
): Promise<PortfolioDiscovery> {
  const base = baseUrl ?? getPortfolioBaseUrl();
  const apiUrl = `${base}/api`;
  const res = await fetch(apiUrl, {
    next: { revalidate: CACHE_REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`Portfolio discovery failed (${res.status}): ${apiUrl}`);
  }
  const data = (await res.json()) as {
    baseUrl?: string;
    endpoints?: Array<{ path: string; description?: string }>;
  };
  const resolvedBase = normalizeBaseUrl(data.baseUrl ?? base);
  return {
    baseUrl: resolvedBase,
    endpoints: (data.endpoints ?? []).map((e) => ({
      path: e.path.startsWith('/') ? e.path : `/${e.path}`,
      description: e.description ?? '',
    })),
  };
}

/** Fetch a single endpoint by path (e.g. /api/resume). Returns response text (JSON string). */
export async function fetchEndpoint(
  baseUrl: string,
  path: string
): Promise<string> {
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    next: { revalidate: CACHE_REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`Portfolio endpoint failed (${res.status}): ${url}`);
  }
  return res.text();
}

/** Paths we fetch for full assistant context. */
const CONTEXT_PATHS = [
  '/api/resume',
  '/api/about',
  '/api/services',
  '/api/case-studies',
  '/api/projects',
  '/api/consulting',
  '/api/contact',
] as const;

export type PortfolioContext = Record<string, unknown>;

/**
 * Fetch discovery, then all context endpoints. Returns a single object keyed by endpoint name
 * (e.g. resume, about, services) for the system prompt. If discovery fails, fetches known paths using base URL from env.
 */
export async function fetchPortfolioContext(): Promise<string> {
  let baseUrl: string;
  let pathSet: Set<string> | null = null;

  try {
    const discovery = await fetchDiscovery();
    baseUrl = normalizeBaseUrl(discovery.baseUrl);
    pathSet = new Set(discovery.endpoints.map((e) => e.path));
  } catch {
    baseUrl = getPortfolioBaseUrl();
    // No discovery: fetch all known context paths
  }

  const context: Record<string, unknown> = {};

  for (const path of CONTEXT_PATHS) {
    if (pathSet !== null && !pathSet.has(path)) continue;
    try {
      const text = await fetchEndpoint(baseUrl, path);
      const name = path.replace(/^\/api\/?/, '') || 'index';
      context[name] = JSON.parse(text) as unknown;
    } catch (err) {
      console.warn(`[portfolio-api] Skipping ${path}:`, err);
    }
  }

  return JSON.stringify(context, null, 2);
}
