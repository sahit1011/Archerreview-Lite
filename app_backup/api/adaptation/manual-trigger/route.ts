import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, StudyPlan } from '@/models';
import { runAdaptationAgent } from '@/services/adaptationAgent';
import { runMonitorAgent } from '@/services/monitorAgent';

/**
 * API endpoint for manually triggering the adaptation agent for all users
 * This is a protected endpoint that should only be accessible to admins
 * POST /api/adaptation/manual-trigger
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Check for admin key (simple protection for demo)
    if (!body.adminKey || body.adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized access'
        },
        { status: 401 }
      );
    }

    // Get all users with study plans
    const studyPlans = await StudyPlan.find({});

    if (studyPlans.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No study plans found'
        },
        { status: 404 }
      );
    }

    // Run adaptation agent for each user
    const results = [];

    for (const plan of studyPlans) {
      try {
        const userId = plan.user.toString();

        // Get monitoring data first
        let monitoringData;
        try {
          monitoringData = await runMonitorAgent(userId);
        } catch (monitorError) {
          console.warn(`Error running monitor agent for user ${userId}:`, monitorError);
          // Continue without monitoring data
        }

        // Run adaptation agent with monitoring data if available
        const result = await runAdaptationAgent(userId, monitoringData);

        results.push({
          userId,
          success: true,
          adaptations: result.adaptations.length,
          llmAdaptations: result.llmAdaptations ? result.llmAdaptations.adaptations.length : 0,
          summary: result.summary
        });
      } catch (error) {
        results.push({
          userId: plan.user.toString(),
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Adaptation agent triggered for ${results.length} users`,
      results
    });
  } catch (error) {
    console.error('Error triggering adaptation agent for all users:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to trigger adaptation agent for all users',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
