import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models';

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.examDate) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: name, email, examDate' 
        },
        { status: 400 }
      );
    }
    
    // Create user
    const user = new User({
      name: body.name,
      email: body.email,
      password: body.password,
      examDate: new Date(body.examDate),
      preferences: body.preferences || {}
    });
    
    // Save user to database
    await user.save();
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        examDate: user.examDate,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Check for duplicate email error
    if (error instanceof Error && error.message.includes('duplicate key error')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email already exists' 
        },
        { status: 409 }
      );
    }
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create user',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Connect to the database
    await dbConnect();
    
    // Get all users (limit to 10 for safety)
    const users = await User.find().limit(10).select('-password');
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch users',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
