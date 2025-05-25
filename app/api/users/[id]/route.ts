import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Access the id from params (using await to fix Next.js warning)
    const { id: userId } = context.params;

    // Find user by ID
    const user = await User.findById(userId).select('-password');

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch user',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();

    // Access the id from params (using await to fix Next.js warning)
    const { id: userId } = context.params;

    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        name: body.name,
        email: body.email,
        examDate: body.examDate ? new Date(body.examDate) : undefined,
        preferences: body.preferences
      },
      { new: true }
    ).select('-password');

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update user',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Access the id from params (using await to fix Next.js warning)
    const { id: userId } = context.params;

    // Find and delete user
    const user = await User.findByIdAndDelete(userId);

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete user',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();

    // Prepare update object
    const updateData: any = {};

    // Only include fields that are provided in the request
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.examDate) updateData.examDate = new Date(body.examDate);
    if (body.preferences) updateData.preferences = body.preferences;

    // Access the id from params (using await to fix Next.js warning)
    const { id: userId } = context.params;

    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update user',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
