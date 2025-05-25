import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, parseAuthHeader } from '@/utils/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

/**
 * Middleware to authenticate API requests
 */
export async function authMiddleware(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    const token = parseAuthHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token and get the user ID
    const decoded = getUserFromToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Find the user by ID
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Add the user to the request
    (req as any).user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    return null; // Continue to the next middleware or route handler
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get the authenticated user from a request
 */
export function getAuthUser(req: NextRequest): { id: string; email: string; role: string } | null {
  return (req as any).user || null;
}
