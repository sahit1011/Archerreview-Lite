/**
 * Client-side fetch shim: automatically attach the logged-in user's JWT as a Bearer token
 * to same-origin /api/* requests.
 *
 * Why: the API routes are now auth-guarded (requireAuth derives the userId from a verified
 * token). The existing frontend makes ~135 hand-rolled fetch() calls that historically passed
 * userId as a query/body param and did NOT send an Authorization header. Rather than touch every
 * call site, we wrap window.fetch once so every /api request carries the token. The server then
 * trusts the token's userId and ignores any client-supplied one (closing IDOR) while the app
 * keeps working unchanged.
 *
 * Only same-origin /api/* requests are touched; Next.js internals (/_next, RSC) are left alone.
 */
let installed = false;

export function installAuthFetch(): void {
  if (installed || typeof window === 'undefined' || !window.fetch) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;

      // Only same-origin API calls (relative '/api/...' or absolute to this origin)
      const isApi =
        url.startsWith('/api/') ||
        url.startsWith(`${window.location.origin}/api/`);

      if (isApi) {
        const token = localStorage.getItem('token');
        if (token) {
          const headers = new Headers(
            init?.headers ?? (input instanceof Request ? input.headers : undefined)
          );
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
            init = { ...(init ?? {}), headers };
          }
        }
      }
    } catch {
      // Never let the shim break a request — fall through to the original fetch
    }

    return originalFetch(input as RequestInfo | URL, init);
  };
}
