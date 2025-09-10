import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, StudyPlan } from '@/models';
import { runAdaptationAgent } from '@/services/adaptationAgent';
import { runMonitorAgent } from '@/services/monitorAgent';

/**
 * API endpoint for triggering the adaptation agent for a specific user
 * POST /api/adaptation
 * Body: { userId: string }
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

    // Get monitoring data first
    let monitoringData;
    try {
      monitoringData = await runMonitorAgent(body.userId);
    } catch (monitorError) {
      console.warn('Error running monitor agent before adaptation:', monitorError);
      // Continue without monitoring data
    }

    // Run adaptation agent with monitoring data if available
    const result = await runAdaptationAgent(body.userId, monitoringData);

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
    // Connect to the database
    await dbConnect();

    // Get userId from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Validate required parameters
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required parameter: userId'
        },
        { status: 400 }
      );
    }

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

    // For now, we'll return a mock adaptation history
    // In a real implementation, this would be stored in the database
    return NextResponse.json({
      success: true,
      adaptationHistory: {
        recentAdaptations: [
          {
            date: new Date(Date.now() - 86400000 * 2), // 2 days ago
            type: 'RESCHEDULE_MISSED_TASK',
            description: 'Rescheduled missed task "Pharmacology Quiz" from Monday to Wednesday',
            affectedTaskIds: ['mock-task-id-1']
          },
          {
            date: new Date(Date.now() - 86400000 * 4), // 4 days ago
            type: 'ADJUST_DIFFICULTY',
            description: 'Adjusted difficulty of task "Cardiac Assessment" from HARD to MEDIUM due to struggling with difficult content',
            affectedTaskIds: ['mock-task-id-2']
          },
          {
            date: new Date(Date.now() - 86400000 * 7), // 7 days ago
            type: 'ADD_REVIEW_SESSION',
            description: 'Added review session for "Fluid and Electrolyte Balance" on Friday based on your performance',
            affectedTaskIds: ['mock-task-id-3']
          }
        ],
        stats: {
          totalAdaptations: 12,
          rescheduledTasks: 5,
          difficultyAdjustments: 3,
          reviewSessionsAdded: 2,
          remedialContentAdded: 1,
          workloadRebalanced: true,
          patternAdjustments: 1
        }
      }
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
