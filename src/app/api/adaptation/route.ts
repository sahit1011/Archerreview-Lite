import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { User, StudyPlan, Adaptation } from '@/models';
import { runAdaptationAgent } from '@/services/adaptationAgent';
import { runMonitorAgent } from '@/services/monitorAgent';

/**
 * API endpoint for triggering the adaptation agent for a specific user
 * POST /api/adaptation
 * Body: { userId: string }
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

    // Get monitoring data first
    let monitoringData;
    try {
      monitoringData = await runMonitorAgent(userId);
    } catch (monitorError) {
      console.warn('Error running monitor agent before adaptation:', monitorError);
      // Continue without monitoring data
    }

    // Run adaptation agent with monitoring data if available
    const result = await runAdaptationAgent(userId, monitoringData);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Adaptation agent triggered successfully',
      result
    });
  } catch (error) {
    console.error('Error triggering adaptation agent:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to trigger adaptation agent',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for retrieving adaptation history for a specific user
 * GET /api/adaptation?userId=<userId>
 */
export async function GET(request: NextRequest) {
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

    // Real adaptation history from the Adaptation collection (written by the agent).
    const adaptations = await Adaptation.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
    const countBy = (type: string) => adaptations.filter((a) => a.type === type).length;
    return NextResponse.json({
      success: true,
      adaptationHistory: {
        recentAdaptations: adaptations.slice(0, 10).map((a) => ({
          date: a.createdAt,
          type: a.type,
          description: a.description,
          affectedTaskIds: (a.metadata as any)?.affectedTaskIds || (a.task ? [String(a.task)] : []),
        })),
        stats: {
          totalAdaptations: adaptations.length,
          rescheduledTasks: countBy('RESCHEDULE'),
          difficultyAdjustments: countBy('DIFFICULTY_ADJUSTMENT'),
          reviewSessionsAdded: countBy('CONTENT_ADDITION'),
          remedialContentAdded: countBy('REMEDIAL_CONTENT'),
          workloadRebalanced: countBy('PLAN_REBALANCE') > 0,
        },
      },
    });
  } catch (error) {
    console.error('Error retrieving adaptation history:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve adaptation history',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
