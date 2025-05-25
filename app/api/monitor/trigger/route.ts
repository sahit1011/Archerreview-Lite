import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, StudyPlan } from '@/models';
import { runMonitorAgent } from '@/services/monitorAgent';
import { runAdaptationAgent } from '@/services/adaptationAgent';

/**
 * API endpoint for manually triggering the monitor agent for a specific user
 * POST /api/monitor/trigger
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required field: userId'
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

    // Check if user has a study plan
    const studyPlan = await StudyPlan.findOne({ user: body.userId });
    if (!studyPlan) {
      return NextResponse.json(
        {
          success: false,
          message: 'User does not have a study plan'
        },
        { status: 400 }
      );
    }

    // Run monitor agent
    const monitorResult = await runMonitorAgent(body.userId);

    // Run adaptation agent if there are alerts
    let adaptationResult = null;
    if (monitorResult.alerts && monitorResult.alerts.length > 0) {
      try {
        adaptationResult = await runAdaptationAgent(body.userId);
      } catch (adaptError) {
        console.error('Error running adaptation agent:', adaptError);
        // Continue even if adaptation fails
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Monitor agent triggered successfully' + (adaptationResult ? ' with adaptation' : ''),
      monitorResult,
      adaptationResult
    });
  } catch (error) {
    console.error('Error triggering monitor agent:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to trigger monitor agent',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
