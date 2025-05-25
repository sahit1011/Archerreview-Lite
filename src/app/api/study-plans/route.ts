import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { StudyPlan, User } from '@/models';

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.userId || !body.examDate) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: userId, examDate'
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findById(body.userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    // Check if user already has a study plan
    const existingPlan = await StudyPlan.findOne({ user: body.userId });
    if (existingPlan) {
      return NextResponse.json(
        {
          success: false,
          message: 'User already has a study plan'
        },
        { status: 409 }
      );
    }

    // Create study plan
    const studyPlan = new StudyPlan({
      user: body.userId,
      examDate: new Date(body.examDate),
      isPersonalized: body.isPersonalized || false,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      endDate: new Date(body.examDate)
    });

    // Save study plan to database
    await studyPlan.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Study plan created successfully',
      studyPlan
    });
  } catch (error) {
    console.error('Error creating study plan:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create study plan',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Get user ID from query params
    const userId = request.nextUrl.searchParams.get('userId');

    // If userId is provided, get study plan for that user
    if (userId) {
      const studyPlan = await StudyPlan.findOne({ user: userId });

      if (!studyPlan) {
        return NextResponse.json(
          {
            success: false,
            message: 'Study plan not found for this user'
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        studyPlan
      });
    }

    // Otherwise, get all study plans (limit to 10 for safety)
    const studyPlans = await StudyPlan.find().limit(10);

    // Return success response
    return NextResponse.json({
      success: true,
      studyPlans
    });
  } catch (error) {
    console.error('Error fetching study plans:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch study plans',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
