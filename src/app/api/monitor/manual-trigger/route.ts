import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { User, StudyPlan } from '@/models';
import { runMonitorAgent } from '@/services/monitorAgent';
import { runAdaptationAgent } from '@/services/adaptationAgent';

/**
 * API endpoint for manually triggering the monitor agent for all users
 * This is a protected endpoint that should only be accessible to admins
 * POST /api/monitor/manual-trigger
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireAdmin(request);
    if (auth.response) return auth.response;

    // Connect to the database
    await dbConnect();

    // Get all users with study plans
    const studyPlans = await StudyPlan.find({});
    const userIds = studyPlans.map(plan => plan.user);

    console.log(`Found ${userIds.length} users with study plans`);

    // Run monitor agent and adaptation agent for each user
    const results = [];

    for (const userId of userIds) {
      try {
        console.log(`Running monitor agent for user ${userId}...`);
        const monitorResult = await runMonitorAgent(userId.toString());

        // Run adaptation agent if there are alerts
        let adaptationResult = null;
        if (monitorResult.alerts && monitorResult.alerts.length > 0) {
          console.log(`Running adaptation agent for user ${userId}...`);
          try {
            adaptationResult = await runAdaptationAgent(userId.toString());
          } catch (adaptError) {
            console.error(`Error running adaptation agent for user ${userId}:`, adaptError);
            // Continue even if adaptation fails
          }
        }

        results.push({
          userId: userId.toString(),
          success: true,
          alerts: monitorResult.alerts.length,
          adaptations: adaptationResult ? adaptationResult.adaptations.length : 0
        });
      } catch (error) {
        console.error(`Error running monitor agent for user ${userId}:`, error);
        results.push({
          userId: userId.toString(),
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Monitor and adaptation agents triggered for ${userIds.length} users`,
      results
    });
  } catch (error) {
    console.error('Error triggering monitor agent:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to trigger monitor and adaptation agents',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
