import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { generateToken } from '@/utils/auth';

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse the request body
    const body = await req.json();
    const { name, email, password, examDate } = body;

    // Validate required fields
    if (!name || !email || !password || !examDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // Create a new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      examDate,
      isEmailVerified: true, // For simplicity in the prototype, we'll auto-verify
      lastLogin: new Date()
    });

    // Save the user to the database
    await user.save();

    // Generate a JWT token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Return the user data and token (excluding password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      examDate: user.examDate,
      preferences: user.preferences,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        user: userData,
        token
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
