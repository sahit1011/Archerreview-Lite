/**
 * Server-side auth guard for API route handlers.
 *
 * The security rule for this codebase: the authenticated user's id comes from a VERIFIED
 * JWT — never from a query string or request body. Routes must call `requireAuth(req)` and
 * use `auth.user.id` for every ownership-scoped query, ignoring any client-supplied userId.
 * This closes the mass-IDOR hole where ~40 routes trusted a client-provided userId.
 *
 * Runs in the Node runtime (route handlers), so it can use the jsonwebtoken-based verifier.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, parseAuthHeader } from '@/utils/auth';

export type AuthUser = { id: string; email: string; role: string };

/**
 * Resolve the authenticated user from a request's Bearer token (or auth cookie), or null.
 * The token is verified (signature + expiry) — a forged/expired token yields null.
 */
export function getAuthUser(req: NextRequest): AuthUser | null {
  let token = parseAuthHeader(req.headers.get('authorization'));
  if (!token) {
    // Fall back to a cookie if the client stores the token there
    token = req.cookies.get('token')?.value || req.cookies.get('auth_token')?.value || null;
  }
  if (!token) return null;

  const decoded = getUserFromToken(token);
  if (!decoded || !decoded.id) return null;
  return { id: decoded.id, email: decoded.email, role: decoded.role };
}

type AuthOk = { user: AuthUser; response?: undefined };
type AuthFail = { user?: undefined; response: NextResponse };

/**
 * Guard for a route handler. Usage:
 *
 *   const auth = requireAuth(request);
 *   if (auth.response) return auth.response;     // 401, short-circuit
 *   const userId = auth.user.id;                 // trusted, token-derived
 */
export function requireAuth(req: NextRequest): AuthOk | AuthFail {
  const user = getAuthUser(req);
  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * Allow a user to act on their OWN resource, or an admin on anyone's.
 * Use for /users/[id]-style routes where self-service (profile, onboarding) is legitimate
 * but cross-user access must be blocked.
 */
export function requireSelfOrAdmin(req: NextRequest, targetUserId: string): AuthOk | AuthFail {
  const result = requireAuth(req);
  if (result.response) return result;
  if (result.user.id !== String(targetUserId) && result.user.role !== 'admin') {
    return {
      response: NextResponse.json(
        { success: false, message: 'You can only access your own account' },
        { status: 403 }
      ),
    };
  }
  return result;
}

/** Like requireAuth but additionally requires an admin role (403 otherwise). */
export function requireAdmin(req: NextRequest): AuthOk | AuthFail {
  const result = requireAuth(req);
  if (result.response) return result;
  if (result.user.role !== 'admin') {
    return {
      response: NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      ),
    };
  }
  return result;
}
