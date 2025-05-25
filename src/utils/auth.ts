import jwt from 'jsonwebtoken';
import { User } from '@/types';

// JWT secret key - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

/**
 * Generate a JWT token for a user
 */
export const generateToken = (user: Partial<User>): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Extract user from token
 */
export const getUserFromToken = (token: string): { id: string; email: string; role: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    return decoded;
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
