import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { runMonitorAgent, getMonitoringStats } from '@/services/monitorAgent';

/**
 * API endpoint for running the monitor agent
 * POST /api/monitor
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

    // Run monitor agent
    const result = await runMonitorAgent(body.userId);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Monitor agent run successfully',
      result
    });
  } catch (error) {
    console.error('Error running monitor agent:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to run monitor agent',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for getting monitoring statistics
 * GET /api/monitor?userId=123
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Get user ID from query params
    const userId = request.nextUrl.searchParams.get('userId');

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required query parameter: userId'
        },
        { status: 400 }
      );
    }

    // For demo purposes, skip the user check
    // In a real implementation, we would check if the user exists

    // Get actual data from the database
    const Task = (await import('@/models/Task')).default;
    const StudyPlan = (await import('@/models/StudyPlan')).default;
    const ReadinessScore = (await import('@/models/ReadinessScore')).default;
    const Performance = (await import('@/models/Performance')).default;

    // Get user's study plan
    const studyPlan = await StudyPlan.findOne({ user: userId });
    if (!studyPlan) {
      return NextResponse.json(
        {
          success: false,
          message: 'Study plan not found for user'
        },
        { status: 404 }
      );
    }

    // Get readiness score
    const readinessScore = await ReadinessScore.findOne({ user: userId });

    // Get tasks
    const totalTasks = await Task.countDocuments({ plan: studyPlan._id });
    const completedTasks = await Task.countDocuments({ plan: studyPlan._id, status: 'COMPLETED' });
    const missedTasks = await Task.countDocuments({
      plan: studyPlan._id,
      status: 'PENDING',
      endTime: { $lt: new Date() }
    });
    const upcomingTasks = await Task.countDocuments({
      plan: studyPlan._id,
      status: 'PENDING',
      startTime: { $gt: new Date() }
    });

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate days until exam
    const daysUntilExam = Math.ceil((studyPlan.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Get performances
    const performances = await Performance.find({ user: userId });
    const averagePerformance = performances.length > 0
      ? performances.reduce((sum, p) => sum + (p.score || 0), 0) / performances.length
      : 0;
    const averageConfidence = performances.length > 0
      ? performances.reduce((sum, p) => sum + (p.confidence || 0), 0) / performances.length
      : 0;

    // Build stats object
    const stats = {
      totalTasks,
      completedTasks,
      missedTasks,
      upcomingTasks,
      averagePerformance,
      averageConfidence,
      completionRate,
      readinessScore: readinessScore ? readinessScore.overallScore : 0,
      projectedScore: readinessScore ? readinessScore.projectedScore : 0,
      daysUntilExam,
      examDate: studyPlan.examDate.toISOString().split('T')[0],
      // Include some mock data for visualization purposes
      topicPerformance: readinessScore ? readinessScore.categoryScores.map(c => ({
        topicName: c.category.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' '),
        score: c.score
      })) : [],
      studyPatterns: [
        { timeOfDay: 'Morning', percentage: 25 },
        { timeOfDay: 'Afternoon', percentage: 45 },
        { timeOfDay: 'Evening', percentage: 20 },
        { timeOfDay: 'Night', percentage: 10 }
      ],
      performanceTrend: [
        Math.max(0, Math.round(averagePerformance * 0.8)),
        Math.max(0, Math.round(averagePerformance * 0.85)),
        Math.max(0, Math.round(averagePerformance * 0.9)),
        Math.max(0, Math.round(averagePerformance * 0.95)),
        Math.max(0, Math.round(averagePerformance * 0.98)),
        Math.max(0, Math.round(averagePerformance)),
        Math.min(100, Math.round(averagePerformance * 1.05))
      ],
      studyConsistency: [
        { day: 'Mon', hours: 2.5 },
        { day: 'Tue', hours: 3.0 },
        { day: 'Wed', hours: 2.0 },
        { day: 'Thu', hours: 3.5 },
        { day: 'Fri', hours: 1.5 },
        { day: 'Sat', hours: 4.0 },
        { day: 'Sun', hours: 1.0 }
      ],
      scheduleAdherence: {
        onTime: 75,
        late: 15,
        missed: 10
      },
      sessionDurations: [
        { duration: '< 30 min', percentage: 15 },
        { duration: '30-60 min', percentage: 45 },
        { duration: '1-2 hours', percentage: 30 },
        { duration: '> 2 hours', percentage: 10 }
      ],
      topicTimeInvestment: [
        { topic: 'Pharmacology', timeSpent: 12, performance: 65 },
        { topic: 'Cardiovascular', timeSpent: 8, performance: 72 },
        { topic: 'Mental Health', timeSpent: 6, performance: 78 },
        { topic: 'Pediatrics', timeSpent: 4, performance: 68 }
      ],
      readinessProjection: [
        { week: 1, actual: Math.max(0, Math.round(readinessScore ? readinessScore.overallScore * 0.7 : 0)) },
        { week: 2, actual: Math.max(0, Math.round(readinessScore ? readinessScore.overallScore * 0.8 : 0)) },
        { week: 3, actual: Math.max(0, Math.round(readinessScore ? readinessScore.overallScore * 0.9 : 0)) },
        { week: 4, actual: Math.max(0, Math.round(readinessScore ? readinessScore.overallScore * 0.95 : 0)) },
        { week: 5, actual: Math.max(0, Math.round(readinessScore ? readinessScore.overallScore : 0)) },
        { week: 6, projected: Math.min(100, Math.round(readinessScore ? readinessScore.projectedScore * 0.9 : 0)) },
        { week: 7, projected: Math.min(100, Math.round(readinessScore ? readinessScore.projectedScore * 0.95 : 0)) },
        { week: 8, projected: Math.min(100, Math.round(readinessScore ? readinessScore.projectedScore : 0)) }
      ],
      readinessBreakdown: {
        Knowledge: Math.round(averagePerformance),
        TestStrategy: Math.round(averagePerformance * 0.9),
        TimeManagement: Math.round(completionRate),
        Confidence: Math.round(averageConfidence * 20) // Scale 0-5 to 0-100
      }
    };

    // Return success response with actual data
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting monitoring statistics:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get monitoring statistics',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
