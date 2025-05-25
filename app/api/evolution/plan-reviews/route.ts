import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, StudyPlan } from '@/models';

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();

    // Get user ID from query params
    const userId = request.nextUrl.searchParams.get('userId');
    console.log('Received request for plan reviews with userId:', userId);

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

    // Generate mock plan review data
    const planReviews = generateMockPlanReviews();

    // Return success response with the array directly as planReviews
    return NextResponse.json({
      success: true,
      planReviews: planReviews
    });
  } catch (error) {
    console.error('Error in plan reviews API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error retrieving plan reviews',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}

function generateMockPlanReviews() {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);

  return [
    {
      _id: 'review1',
      reviewDate: today,
      nextReviewDate: nextMonth,
      status: 'IN_PROGRESS',
      optimizationSuggestions: [
        {
          type: 'DIFFICULTY_ADJUSTMENT',
          description: 'Increase difficulty for Pharmacology topics',
          reason: 'Performance has consistently exceeded targets in this area',
          impact: 'MEDIUM',
          approved: false,
          applied: false
        },
        {
          type: 'CONTENT_ADDITION',
          description: 'Add more practice questions for Psychosocial Integrity',
          reason: 'Performance is below target in this area',
          impact: 'HIGH',
          approved: false,
          applied: false
        },
        {
          type: 'SCHEDULE_REBALANCE',
          description: 'Redistribute workload to reduce overloaded days',
          reason: 'Several days have more than 4 hours of scheduled tasks',
          impact: 'MEDIUM',
          approved: false,
          applied: false
        }
      ],
      metrics: {
        performanceImprovement: 8,
        timeOptimization: 15,
        topicCoverageIncrease: 5,
        readinessBoost: 7
      },
      summary: 'This monthly review identified several opportunities for optimization. Implementing these changes could improve your readiness score by approximately 7% while making your study schedule more balanced and effective.'
    },
    {
      _id: 'review2',
      reviewDate: lastMonth,
      nextReviewDate: today,
      status: 'COMPLETED',
      optimizationSuggestions: [
        {
          type: 'REVIEW_FREQUENCY',
          description: 'Increase review frequency for Management of Care',
          reason: 'Retention metrics show decline in this area',
          impact: 'HIGH',
          approved: true,
          applied: true
        },
        {
          type: 'TOPIC_FOCUS',
          description: 'Allocate more time to Physiological Adaptation',
          reason: 'This is a high-value topic with below-average performance',
          impact: 'HIGH',
          approved: true,
          applied: true
        },
        {
          type: 'DIFFICULTY_ADJUSTMENT',
          description: 'Decrease difficulty for Health Promotion temporarily',
          reason: 'Recent performance has declined significantly',
          impact: 'MEDIUM',
          approved: false,
          applied: false
        }
      ],
      metrics: {
        performanceImprovement: 12,
        timeOptimization: 10,
        topicCoverageIncrease: 8,
        readinessBoost: 9
      },
      summary: 'The previous monthly review resulted in significant improvements to your study plan. The implemented changes have contributed to a 12% increase in performance in the targeted areas.'
    }
  ];
}
