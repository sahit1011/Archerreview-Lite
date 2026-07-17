import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { User, StudyPlan } from '@/models';
import { runMonitorAgent } from '@/services/monitorAgent';
import { runAdaptationAgent } from '@/services/adaptationAgent';

/**
 * API endpoint for manually triggering the monitor agent for a specific user
 * POST /api/monitor/trigger
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id; // TRUSTED, token-derived

    // Connect to the database
    await dbConnect();

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

    // Check if user has a study plan
    const studyPlan = await StudyPlan.findOne({ user: userId });
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
    const monitorResult = await runMonitorAgent(userId);

    // Run adaptation agent if there are alerts
    let adaptationResult = null;
    if (monitorResult.alerts && monitorResult.alerts.length > 0) {
      try {
        adaptationResult = await runAdaptationAgent(userId);
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
