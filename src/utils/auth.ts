import crypto from 'crypto';
import { User } from '@/types';

/**
 * Minimal, dependency-free HS256 JWT (sign + verify).
 *
 * Replaces `jsonwebtoken`, which crashes on load under Node 26 ("Cannot read properties of
 * undefined (reading 'prototype')"). These produce/consume standard HS256 JWTs and stay fully
 * SYNCHRONOUS, so the auth guard and all 57 API routes keep their sync contract (unlike `jose`,
 * whose verify is async).
 */
function _b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function _hs256(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

function _signJwt(payload: Record<string, any>, secret: string, expiresInSec: number): string {
  const now = Math.floor(Date.now() / 1000);
  const header = _b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = _b64url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec }));
  const data = `${header}.${body}`;
  return `${data}.${_hs256(data, secret)}`;
}

function _verifyJwt(token: string, secret: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [header, body, sig] = parts;
  const expected = _hs256(`${header}.${body}`, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('Bad signature');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error('Token expired');
  return payload;
}

// Resolve the JWT signing secret. A real value is REQUIRED — the old code silently fell
// back to the public literal 'your-secret-key', which makes every token trivially forgeable
// if deployed without the env set. In production we refuse to start; in dev we mint an
// ephemeral per-process secret (tokens reset on restart) and warn loudly.
const _PLACEHOLDER_SECRETS = new Set(['', 'your-secret-key', 'change-me', 'secret', 'changeme']);

function resolveJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && !_PLACEHOLDER_SECRETS.has(fromEnv)) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET is missing or set to a placeholder. Refusing to start in production — ' +
      'set a strong, unique JWT_SECRET.'
    );
  }
  console.warn(
    '[auth] JWT_SECRET not set — using an ephemeral development secret. ' +
    'Tokens will be invalidated on every restart. Set JWT_SECRET in .env for stable sessions.'
  );
  return crypto.randomBytes(48).toString('hex');
}

// Exported so the (otherwise-unused) NextAuth config can share the same resolved secret
export const JWT_SECRET = resolveJwtSecret();
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

/**
 * Generate a JWT token for a user
 */
export const generateToken = (user: Partial<User>): string => {
  return _signJwt(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    7 * 24 * 60 * 60 // 7 days
  );
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string): any => {
  try {
    return _verifyJwt(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Extract user from token
 */
export const getUserFromToken = (token: string): { id: string; email: string; role: string } | null => {
  try {
    return _verifyJwt(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch (error) {
    return null;
  }
};

/**
 * Parse the authorization header to get the token
 */
export const parseAuthHeader = (authHeader: string | null | undefined): string | null => {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
};
