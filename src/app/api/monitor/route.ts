import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import User from '@/models/User';
import { runMonitorAgent, getMonitoringStats } from '@/services/monitorAgent';

/**
 * API endpoint for running the monitor agent
 * POST /api/monitor
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

    // Run monitor agent
    const result = await runMonitorAgent(userId);

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
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id; // TRUSTED, token-derived

    // Connect to the database
    await dbConnect();

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

    // Get performances (topic populated for topic-time investment)
    const performances = await Performance.find({ user: userId }).populate('topic').sort({ createdAt: 1 });
    const averagePerformance = performances.length > 0
      ? performances.reduce((sum, p) => sum + (p.score || 0), 0) / performances.length
      : 0;
    const averageConfidence = performances.length > 0
      ? performances.reduce((sum, p) => sum + (p.confidence || 0), 0) / performances.length
      : 0;

    // Completed tasks with topic — the ground truth for study-habit analytics.
    const completedTaskDocs = await Task.find({ plan: studyPlan._id, status: 'COMPLETED' }).populate('topic');

    // --- REAL study-habit analytics (empty when there's no data — never fabricated) ---
    // Time-of-day distribution from when tasks were actually completed (updatedAt).
    const todBuckets = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    for (const t of completedTaskDocs) {
      const h = new Date((t as any).updatedAt || t.startTime).getHours();
      if (h >= 5 && h < 12) todBuckets.Morning++;
      else if (h >= 12 && h < 17) todBuckets.Afternoon++;
      else if (h >= 17 && h < 21) todBuckets.Evening++;
      else todBuckets.Night++;
    }
    const todTotal = completedTaskDocs.length;
    const studyPatterns = todTotal > 0
      ? Object.entries(todBuckets).map(([timeOfDay, n]) => ({ timeOfDay, percentage: Math.round((n / todTotal) * 100) }))
      : [];

    // Real chronological performance trend (last 7 graded attempts).
    const performanceTrend = performances.slice(-7).map(p => Math.round(p.score || 0));

    // Hours studied per weekday, from completed task durations.
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayHours: Record<string, number> = {};
    for (const t of completedTaskDocs) {
      const d = dayNames[new Date((t as any).updatedAt || t.startTime).getDay()];
      dayHours[d] = (dayHours[d] || 0) + (t.duration || 0) / 60;
    }
    const studyConsistency = todTotal > 0
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({ day, hours: Math.round((dayHours[day] || 0) * 10) / 10 }))
      : [];

    // Schedule adherence: on-time vs late completions vs still-missed.
    let onTimeCount = 0, lateCount = 0;
    for (const t of completedTaskDocs) {
      const completedAt = new Date((t as any).updatedAt || t.startTime).getTime();
      if (completedAt <= new Date(t.endTime).getTime() + 24 * 3600 * 1000) onTimeCount++;
      else lateCount++;
    }
    const adherenceTotal = onTimeCount + lateCount + missedTasks;
    const scheduleAdherence = adherenceTotal > 0
      ? {
          onTime: Math.round((onTimeCount / adherenceTotal) * 100),
          late: Math.round((lateCount / adherenceTotal) * 100),
          missed: Math.round((missedTasks / adherenceTotal) * 100),
        }
      : null;

    // Session-duration distribution from completed tasks.
    const durBuckets = { '< 30 min': 0, '30-60 min': 0, '1-2 hours': 0, '> 2 hours': 0 };
    for (const t of completedTaskDocs) {
      const m = t.duration || 0;
      if (m < 30) durBuckets['< 30 min']++;
      else if (m < 60) durBuckets['30-60 min']++;
      else if (m < 120) durBuckets['1-2 hours']++;
      else durBuckets['> 2 hours']++;
    }
    const sessionDurations = todTotal > 0
      ? Object.entries(durBuckets).map(([duration, n]) => ({ duration, percentage: Math.round((n / todTotal) * 100) }))
      : [];

    // Time invested per topic + performance there (from real Performance records).
    const topicAgg: Record<string, { topic: string; minutes: number; scores: number[] }> = {};
    for (const p of performances) {
      const name = (p.topic as any)?.name;
      if (!name) continue;
      if (!topicAgg[name]) topicAgg[name] = { topic: name, minutes: 0, scores: [] };
      topicAgg[name].minutes += p.timeSpent || 0;
      if (typeof p.score === 'number') topicAgg[name].scores.push(p.score);
    }
    const topicTimeInvestment = Object.values(topicAgg)
      .map(a => ({
        topic: a.topic,
        timeSpent: Math.round((a.minutes / 60) * 10) / 10,
        performance: a.scores.length ? Math.round(a.scores.reduce((s, v) => s + v, 0) / a.scores.length) : 0,
      }))
      .sort((a, b) => b.timeSpent - a.timeSpent)
      .slice(0, 6);

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
      // Per-subject scores from the real readiness calculation.
      topicPerformance: readinessScore ? readinessScore.categoryScores.map(c => ({
        topicName: c.category.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' '),
        score: c.score
      })) : [],
      // All computed from real task/performance history above (empty until data exists).
      studyPatterns,
      performanceTrend,
      studyConsistency,
      scheduleAdherence,
      sessionDurations,
      topicTimeInvestment,
      readinessBreakdown: performances.length > 0 ? {
        Knowledge: Math.round(averagePerformance),
        TimeManagement: Math.round(completionRate),
        Confidence: Math.round(averageConfidence * 20) // Scale 0-5 to 0-100
      } : null
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
