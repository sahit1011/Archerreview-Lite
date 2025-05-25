import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { User, StudyPlan, Performance } from '../../../../models';

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();

    // Get user ID from query params
    const userId = request.nextUrl.searchParams.get('userId');
    console.log('Received request for predictions with userId:', userId);

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

    // Generate prediction data
    const predictions = await generatePredictions(userId);
    console.log('Generated predictions successfully');

    // Return success response
    return NextResponse.json({
      success: true,
      predictions
    });
  } catch (error) {
    console.error('Error in predictions API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error generating predictions',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}

async function generatePredictions(userId: string) {
  try {
    // Get user's study plan
    const studyPlan = await StudyPlan.findOne({ user: userId });
    if (!studyPlan) {
      throw new Error(`Study plan not found for user: ${userId}`);
    }

    // Get user's performance data
    const performances = await Performance.find({ user: userId }).sort({ date: -1 }).limit(10);
    
    // Calculate current readiness based on recent performances
    const currentReadiness = performances.length > 0
      ? Math.round(performances.reduce((sum, perf) => sum + perf.score, 0) / performances.length)
      : 68; // Default if no performance data
    
    // Calculate exam date and days until exam
    const examDate = studyPlan.targetDate || new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
    const daysUntilExam = Math.round((examDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    
    // Generate mock prediction data
    const today = new Date();
    
    return {
      currentReadiness,
      predictedReadiness: Math.min(95, currentReadiness + Math.round((85 - currentReadiness) * 0.8)),
      examDate: examDate.toISOString(),
      daysUntilExam,
      confidenceInterval: {
        lower: Math.max(70, currentReadiness + 10),
        upper: Math.min(95, currentReadiness + 20)
      },
      weeklyProjections: [
        { week: 1, date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), projected: Math.min(95, currentReadiness + 4) },
        { week: 2, date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), projected: Math.min(95, currentReadiness + 7) },
        { week: 3, date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(), projected: Math.min(95, currentReadiness + 10) },
        { week: 4, date: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString(), projected: Math.min(95, currentReadiness + 13) },
        { week: 5, date: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString(), projected: Math.min(95, currentReadiness + 15) },
        { week: 6, date: new Date(today.getTime() + 42 * 24 * 60 * 60 * 1000).toISOString(), projected: Math.min(95, currentReadiness + 17) }
      ],
      categoryProjections: [
        { category: 'MANAGEMENT_OF_CARE', current: Math.max(50, currentReadiness - 3), projected: Math.min(95, currentReadiness + 17) },
        { category: 'SAFETY_AND_INFECTION_CONTROL', current: Math.max(50, currentReadiness + 2), projected: Math.min(95, currentReadiness + 15) },
        { category: 'HEALTH_PROMOTION', current: Math.max(50, currentReadiness + 7), projected: Math.min(95, currentReadiness + 13) },
        { category: 'PSYCHOSOCIAL_INTEGRITY', current: Math.max(50, currentReadiness - 8), projected: Math.min(95, currentReadiness + 18) },
        { category: 'BASIC_CARE_AND_COMFORT', current: Math.max(50, currentReadiness + 4), projected: Math.min(95, currentReadiness + 14) },
        { category: 'PHARMACOLOGICAL_THERAPIES', current: Math.max(50, currentReadiness - 6), projected: Math.min(95, currentReadiness + 18) },
        { category: 'REDUCTION_OF_RISK_POTENTIAL', current: Math.max(50, currentReadiness), projected: Math.min(95, currentReadiness + 16) },
        { category: 'PHYSIOLOGICAL_ADAPTATION', current: Math.max(50, currentReadiness + 2), projected: Math.min(95, currentReadiness + 16) }
      ],
      scenarios: [
        {
          name: 'baseline',
          description: 'Current study pace maintained',
          projectedReadiness: Math.min(95, currentReadiness + 17),
          requiredActions: [
            'Complete all scheduled tasks',
            'Maintain current study consistency',
            'Continue with planned review sessions'
          ]
        },
        {
          name: 'accelerated',
          description: 'Increased study intensity',
          projectedReadiness: Math.min(95, currentReadiness + 24),
          requiredActions: [
            'Increase daily study time by 1 hour',
            'Complete 2 additional practice quizzes per week',
            'Add weekly review sessions for weak areas',
            'Increase difficulty level for strong topics'
          ]
        },
        {
          name: 'focused',
          description: 'Focus on weak areas',
          projectedReadiness: Math.min(95, currentReadiness + 20),
          requiredActions: [
            'Allocate 60% of study time to weak topics',
            'Complete remedial content for Psychosocial Integrity',
            'Schedule weekly review sessions for Pharmacological Therapies',
            'Take targeted practice tests for weak areas'
          ]
        },
        {
          name: 'minimal',
          description: 'Reduced study pace',
          projectedReadiness: Math.min(95, currentReadiness + 10),
          requiredActions: [
            'Complete essential tasks only',
            'Focus on high-yield content',
            'Maintain weekly review sessions',
            'Prioritize practice over content review'
          ]
        }
      ],
      insights: [
        'Your performance in Psychosocial Integrity is improving but remains below target.',
        'Your consistency in completing practice quizzes is strongly correlated with improved readiness.',
        'Increasing review frequency for Pharmacological Therapies could significantly improve your overall readiness.',
        'Your current pace puts you on track to reach the target readiness score by your exam date.'
      ]
    };
  } catch (error) {
    console.error('Error generating predictions:', error);
    throw error;
  }
}
