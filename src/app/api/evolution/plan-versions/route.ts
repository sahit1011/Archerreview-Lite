import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { User, StudyPlan, PlanVersion } from '../../../../models';

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();

    // Get user ID from query params
    const userId = request.nextUrl.searchParams.get('userId');
    console.log('Received request for plan versions with userId:', userId);

    // Validate user ID
    if (!userId) {
      console.warn('No userId provided in request');
      return NextResponse.json(
        {
          success: false,
          message: 'User ID is required'
        },
        { status: 400 }
      );
    }

    // Get user and study plan
    console.log('Looking up user with ID:', userId);
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    // Get plan versions
    const planVersions = await PlanVersion.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    // If no plan versions found, generate mock data
    if (planVersions.length === 0) {
      const mockVersions = generateMockPlanVersions(userId);
      return NextResponse.json({
        success: true,
        planVersions: mockVersions
      });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      planVersions
    });
  } catch (error) {
    console.error('Error in plan versions API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error retrieving plan versions',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}

function generateMockPlanVersions(userId: string) {
  const today = new Date();
  
  return [
    {
      versionNumber: 3,
      createdAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      reason: 'Performance Optimization',
      description: 'Adjusted schedule based on recent performance data',
      changes: [
        {
          type: 'TASK_MODIFIED',
          description: 'Increased difficulty of Pharmacology tasks',
          taskId: '123456789012345678901234',
          topicId: '123456789012345678901235'
        },
        {
          type: 'REVIEW_ADDED',
          description: 'Added review sessions for weak topics',
          topicId: '123456789012345678901236'
        }
      ],
      metrics: {
        taskCount: 45,
        averageDifficulty: 2.7,
        topicCoverage: 85,
        reviewFrequency: 0.25,
        workloadBalance: 0.8
      },
      isActive: true,
      createdBy: 'EVOLUTION_AGENT'
    },
    {
      versionNumber: 2,
      createdAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000),
      reason: 'User Preference Update',
      description: 'Modified schedule based on user availability changes',
      changes: [
        {
          type: 'SCHEDULE_REBALANCED',
          description: 'Redistributed tasks to match new availability pattern'
        },
        {
          type: 'TASK_REMOVED',
          description: 'Removed redundant content',
          taskId: '123456789012345678901237'
        }
      ],
      metrics: {
        taskCount: 42,
        averageDifficulty: 2.5,
        topicCoverage: 82,
        reviewFrequency: 0.2,
        workloadBalance: 0.75
      },
      isActive: false,
      createdBy: 'USER'
    },
    {
      versionNumber: 1,
      createdAt: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000),
      reason: 'Initial Plan Creation',
      description: 'Generated initial study plan based on diagnostic assessment',
      changes: [
        {
          type: 'TASK_ADDED',
          description: 'Created initial task set',
        }
      ],
      metrics: {
        taskCount: 40,
        averageDifficulty: 2.3,
        topicCoverage: 80,
        reviewFrequency: 0.15,
        workloadBalance: 0.7
      },
      isActive: false,
      createdBy: 'ADAPTATION_AGENT'
    }
  ];
}
