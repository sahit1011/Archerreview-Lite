import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { StudyPlan, User } from '@/models';
import { requireAuth } from '@/lib/api-auth';
import { parseBody, errorResponse, dateString, z } from '@/lib/validation';

const createStudyPlanSchema = z.object({
  examDate: dateString,
  isPersonalized: z.boolean().optional(),
  startDate: dateString.optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request and derive the trusted userId from the token
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await connectToDatabase();

    // Validate request body
    const parsed = await parseBody(request, createStudyPlanSchema);
    if (parsed.response) return parsed.response;
    const body = parsed.data;

    // Check if user exists
    const user = await User.findById(userId);
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
    const existingPlan = await StudyPlan.findOne({ user: userId });
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
      user: userId,
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

    // Return a generic error response (do not leak error.message to clients)
    return errorResponse('Failed to create study plan', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request and derive the trusted userId from the token
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await connectToDatabase();

    // Get study plan for the authenticated user
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
  } catch (error) {
    console.error('Error fetching study plans:', error);

    // Return a generic error response (do not leak error.message to clients)
    return errorResponse('Failed to fetch study plans', 500);
  }
}
