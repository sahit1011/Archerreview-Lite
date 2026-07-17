import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { StudyPlan, Task, Performance, ReadinessScore, DiagnosticResult, Alert, Adaptation, Note, ScheduledJob } from '@/models';
import { requireAdmin, requireSelfOrAdmin } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;

    // A user may read their own record; admins may read anyone's.
    const auth = requireSelfOrAdmin(request, userId);
    if (auth.response) return auth.response;

    // Connect to the database
    await connectToDatabase();

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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;

    // A user may update their own record (onboarding/profile); admins may update anyone's.
    const auth = requireSelfOrAdmin(request, userId);
    if (auth.response) return auth.response;

    // Connect to the database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();

    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        name: body.name,
        email: body.email,
        examDate: body.examDate ? new Date(body.examDate) : undefined,
        ...(body.examType === 'NEET' || body.examType === 'JEE' ? { examType: body.examType } : {}),
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Access the id from params (using await to fix Next.js warning)
    const { id: userId } = await context.params;

    // A user may delete their own account; admins may delete anyone.
    const auth = requireSelfOrAdmin(request, userId);
    if (auth.response) return auth.response;

    // Connect to the database
    await connectToDatabase();

    // Cascade: remove the user's study data so nothing is orphaned.
    const plans = await StudyPlan.find({ user: userId }).select('_id').lean();
    const planIds = plans.map((p) => p._id);
    await Promise.all([
      Task.deleteMany({ plan: { $in: planIds } }),
      StudyPlan.deleteMany({ user: userId }),
      Performance.deleteMany({ user: userId }),
      ReadinessScore.deleteMany({ user: userId }),
      DiagnosticResult.deleteMany({ user: userId }),
      Alert.deleteMany({ user: userId }),
      Adaptation.deleteMany({ user: userId }),
      Note.deleteMany({ user: userId }),
      ScheduledJob.deleteMany({ userId: String(userId) }),
    ]);

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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;

    // A user may patch their own record; admins may patch anyone's.
    const auth = requireSelfOrAdmin(request, userId);
    if (auth.response) return auth.response;

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
    if (body.examType === 'NEET' || body.examType === 'JEE') updateData.examType = body.examType;
    if (body.preferences) updateData.preferences = body.preferences;

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
