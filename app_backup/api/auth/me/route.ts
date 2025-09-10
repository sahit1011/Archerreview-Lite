import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { getUserFromToken, parseAuthHeader } from '@/utils/auth';

export async function GET(req: NextRequest) {
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

    // Return the user data (excluding password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      examDate: user.examDate,
      preferences: user.preferences,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json(
      {
        success: true,
        user: userData
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching user data' },
      { status: 500 }
    );
  }
}
