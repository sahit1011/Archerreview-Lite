import mongoose from 'mongoose';
import dbConnect from '../lib/db';
import {
  User,
  Task,
  Performance,
  StudyPlan,
  Topic,
  TrendAnalysis,
  PlanVersion
} from '../models';

/**
 * EvolutionAgent - Responsible for long-term plan evolution
 *
 * This service handles:
 * 1. Long-term trend analysis
 * 2. Adaptive difficulty progression
 * 3. Study plan versioning
 * 4. Predictive performance modeling
 * 5. Periodic plan review and optimization
 */

// Types for trend analysis
export interface TrendAnalysisResult {
  userId: string;
  planId: string;
  period: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  startDate: Date;
  endDate: Date;
  metrics: {
    averagePerformance: number;
    completionRate: number;
    topicMastery: Record<string, number>;
    difficultyProgression: number;
    studyConsistency: number;
  };
  trends: {
    performanceTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    completionTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    anomalies: Array<{
      type: string;
      description: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  };
  visualizationData: {
    performanceOverTime: Array<{date: Date, value: number}>;
    completionRateOverTime: Array<{date: Date, value: number}>;
    topicMasteryOverTime: Record<string, Array<{date: Date, value: number}>>;
  };
}

/**
 * Run the Evolution Agent to analyze long-term trends
 * @param userId User ID
 * @param period Analysis period
 * @returns Trend analysis result
 */
export async function analyzeLongTermTrends(
  userId: string,
  period: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' = 'MONTHLY'
): Promise<TrendAnalysisResult> {
  console.log('Starting analyzeLongTermTrends for userId:', userId, 'period:', period);
  await dbConnect();

  try {
    // Get user and study plan
    console.log('Looking up user with ID:', userId);
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      throw new Error(`User not found: ${userId}`);
    }
    console.log('Found user:', user.name);

    console.log('Looking up study plan for user:', userId);
    const studyPlan = await StudyPlan.findOne({ user: userId });
    if (!studyPlan) {
      console.error(`Study plan not found for user: ${userId}`);
      throw new Error(`Study plan not found for user: ${userId}`);
    }
    console.log('Found study plan with ID:', studyPlan._id);

    // Calculate date range based on period
    const endDate = new Date();
    let startDate: Date;

    switch (period) {
      case 'WEEKLY':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'QUARTERLY':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'MONTHLY':
      default:
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    // Get performances within date range
    const performances = await Performance.find({
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: 1 });

    // Get tasks within date range
    const tasks = await Task.find({
      plan: studyPlan._id,
      startTime: { $gte: startDate, $lte: endDate }
    }).populate('topic');

    // Calculate metrics
    const metrics = calculateMetrics(performances, tasks);

    // Analyze trends
    const trends = analyzeTrends(performances, tasks, metrics);

    // Prepare visualization data
    const visualizationData = prepareVisualizationData(performances, tasks);

    // Create result
    const result: TrendAnalysisResult = {
      userId,
      planId: studyPlan._id.toString(),
      period,
      startDate,
      endDate,
      metrics,
      trends,
      visualizationData
    };

    // Store trend analysis in database
    try {
      // Create anomalies array with proper structure
      const anomaliesArray = [];
      for (const anomaly of trends.anomalies) {
        anomaliesArray.push({
          type: anomaly.type,
          description: anomaly.description,
          severity: anomaly.severity,
          detectedAt: new Date()
        });
      }

      await TrendAnalysis.create({
        user: userId,
        plan: studyPlan._id,
        period,
        startDate,
        endDate,
        metrics: {
          averagePerformance: metrics.averagePerformance,
          completionRate: metrics.completionRate,
          consistencyScore: metrics.studyConsistency,
          topicMasteryProgress: metrics.topicMastery,
          difficultyProgression: metrics.difficultyProgression,
          timeManagementScore: 0 // Not implemented yet
        },
        trends: {
          performanceTrend: trends.performanceTrend,
          completionTrend: trends.completionTrend,
          consistencyTrend: 'STABLE', // Not implemented yet
          difficultyTrend: 'STABLE' // Not implemented yet
        },
        anomalies: anomaliesArray,
        insights: []
      });

      console.log('Saved trend analysis to database:', {
        period,
        metrics,
        trends
      });
    } catch (dbError) {
      console.error('Error saving trend analysis to database:', dbError);
      // Continue execution even if database save fails
    }

    return result;
  } catch (error) {
    console.error('Error analyzing long-term trends:', error);
    throw error;
  }
}

/**
 * Calculate metrics from performance and task data
 */
function calculateMetrics(performances: any[], tasks: any[]) {
  // Calculate average performance
  const averagePerformance = performances.length > 0
    ? performances.reduce((sum, p) => sum + (p.score || 0), 0) / performances.length
    : 0;

  // Calculate completion rate
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const completionRate = tasks.length > 0
    ? (completedTasks.length / tasks.length) * 100
    : 0;

  // Calculate topic mastery
  const topicMastery: Record<string, number> = {};
  const topicPerformances: Record<string, number[]> = {};

  // Group performances by topic
  performances.forEach(p => {
    if (p.topic) {
      const topicId = p.topic.toString();
      if (!topicPerformances[topicId]) {
        topicPerformances[topicId] = [];
      }
      topicPerformances[topicId].push(p.score || 0);
    }
  });

  // Calculate average performance for each topic
  Object.entries(topicPerformances).forEach(([topicId, scores]) => {
    topicMastery[topicId] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  });

  // Calculate difficulty progression
  // (Average difficulty of completed tasks over time)
  const difficultyMap = { 'EASY': 1, 'MEDIUM': 2, 'HARD': 3 };
  const difficultyValues = completedTasks.map(t => difficultyMap[t.difficulty] || 0);
  const difficultyProgression = difficultyValues.length > 0
    ? difficultyValues.reduce((sum, val) => sum + val, 0) / difficultyValues.length
    : 0;

  // Calculate study consistency
  // (Standard deviation of days between study sessions, normalized to 0-100 scale)
  const studyDates = [...new Set(tasks.map(t => new Date(t.startTime).toDateString()))];
  let studyConsistency = 100; // Default to perfect consistency

  if (studyDates.length > 1) {
    // Sort dates
    const sortedDates = studyDates
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    // Calculate days between sessions
    const daysBetween = [];
    for (let i = 1; i < sortedDates.length; i++) {
      const days = (sortedDates[i].getTime() - sortedDates[i-1].getTime()) / (1000 * 60 * 60 * 24);
      daysBetween.push(days);
    }

    // Calculate standard deviation
    const avg = daysBetween.reduce((sum, days) => sum + days, 0) / daysBetween.length;
    const squareDiffs = daysBetween.map(days => Math.pow(days - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, diff) => sum + diff, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    // Convert to 0-100 scale (lower std dev = higher consistency)
    // Max std dev we care about is 7 days (1 week)
    studyConsistency = Math.max(0, 100 - (stdDev / 7 * 100));
  }

  return {
    averagePerformance,
    completionRate,
    topicMastery,
    difficultyProgression,
    studyConsistency
  };
}

/**
 * Analyze trends from performance and task data
 */
function analyzeTrends(performances: any[], tasks: any[], metrics: any) {
  // Need at least 2 data points to analyze trends
  if (performances.length < 2) {
    return {
      performanceTrend: 'STABLE',
      completionTrend: 'STABLE',
      anomalies: []
    };
  }

  // Sort performances by date
  const sortedPerformances = [...performances].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Split into first half and second half
  const midpoint = Math.floor(sortedPerformances.length / 2);
  const firstHalf = sortedPerformances.slice(0, midpoint);
  const secondHalf = sortedPerformances.slice(midpoint);

  // Calculate average performance for each half
  const firstHalfAvg = firstHalf.reduce((sum, p) => sum + (p.score || 0), 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, p) => sum + (p.score || 0), 0) / secondHalf.length;

  // Determine performance trend
  let performanceTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  if (secondHalfAvg > firstHalfAvg * 1.05) {
    performanceTrend = 'IMPROVING';
  } else if (secondHalfAvg < firstHalfAvg * 0.95) {
    performanceTrend = 'DECLINING';
  } else {
    performanceTrend = 'STABLE';
  }

  // Sort tasks by date
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Split into first half and second half
  const taskMidpoint = Math.floor(sortedTasks.length / 2);
  const firstHalfTasks = sortedTasks.slice(0, taskMidpoint);
  const secondHalfTasks = sortedTasks.slice(taskMidpoint);

  // Calculate completion rate for each half
  const firstHalfCompletion = firstHalfTasks.filter(t => t.status === 'COMPLETED').length / firstHalfTasks.length;
  const secondHalfCompletion = secondHalfTasks.filter(t => t.status === 'COMPLETED').length / secondHalfTasks.length;

  // Determine completion trend
  let completionTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  if (secondHalfCompletion > firstHalfCompletion * 1.05) {
    completionTrend = 'IMPROVING';
  } else if (secondHalfCompletion < firstHalfCompletion * 0.95) {
    completionTrend = 'DECLINING';
  } else {
    completionTrend = 'STABLE';
  }

  // Detect anomalies
  const anomalies = [];

  // Check for performance anomalies
  if (metrics.averagePerformance < 50) {
    anomalies.push({
      type: 'averagePerformance',
      description: 'Overall performance is significantly below target',
      severity: 'HIGH'
    });
  } else if (metrics.averagePerformance < 70) {
    anomalies.push({
      type: 'averagePerformance',
      description: 'Overall performance is below target',
      severity: 'MEDIUM'
    });
  }

  // Check for completion rate anomalies
  if (metrics.completionRate < 50) {
    anomalies.push({
      type: 'completionRate',
      description: 'Task completion rate is very low',
      severity: 'HIGH'
    });
  } else if (metrics.completionRate < 70) {
    anomalies.push({
      type: 'completionRate',
      description: 'Task completion rate is below target',
      severity: 'MEDIUM'
    });
  }

  // Check for consistency anomalies
  if (metrics.studyConsistency < 50) {
    anomalies.push({
      type: 'studyConsistency',
      description: 'Study schedule is highly inconsistent',
      severity: 'HIGH'
    });
  } else if (metrics.studyConsistency < 70) {
    anomalies.push({
      type: 'studyConsistency',
      description: 'Study schedule shows some inconsistency',
      severity: 'MEDIUM'
    });
  }

  return {
    performanceTrend,
    completionTrend,
    anomalies
  };
}

/**
 * Prepare visualization data for charts
 */
function prepareVisualizationData(performances: any[], tasks: any[]) {
  // Group performances by date
  const performanceByDate = new Map();
  performances.forEach(p => {
    const dateStr = new Date(p.createdAt).toDateString();
    if (!performanceByDate.has(dateStr)) {
      performanceByDate.set(dateStr, []);
    }
    performanceByDate.get(dateStr).push(p.score || 0);
  });

  // Calculate average performance for each date
  const performanceOverTime = Array.from(performanceByDate.entries()).map(([dateStr, scores]) => {
    return {
      date: new Date(dateStr),
      value: scores.reduce((sum, score) => sum + score, 0) / scores.length
    };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group tasks by date
  const tasksByDate = new Map();
  tasks.forEach(t => {
    const dateStr = new Date(t.startTime).toDateString();
    if (!tasksByDate.has(dateStr)) {
      tasksByDate.set(dateStr, { total: 0, completed: 0 });
    }
    tasksByDate.get(dateStr).total++;
    if (t.status === 'COMPLETED') {
      tasksByDate.get(dateStr).completed++;
    }
  });

  // Calculate completion rate for each date
  const completionRateOverTime = Array.from(tasksByDate.entries()).map(([dateStr, data]) => {
    return {
      date: new Date(dateStr),
      value: data.total > 0 ? (data.completed / data.total) * 100 : 0
    };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group performances by topic and date
  const topicPerformanceByDate = new Map();
  performances.forEach(p => {
    if (p.topic) {
      const topicId = p.topic.toString();
      if (!topicPerformanceByDate.has(topicId)) {
        topicPerformanceByDate.set(topicId, new Map());
      }

      const dateStr = new Date(p.createdAt).toDateString();
      if (!topicPerformanceByDate.get(topicId).has(dateStr)) {
        topicPerformanceByDate.get(topicId).set(dateStr, []);
      }

      topicPerformanceByDate.get(topicId).get(dateStr).push(p.score || 0);
    }
  });

  // Calculate average performance for each topic and date
  const topicMasteryOverTime: Record<string, Array<{date: Date, value: number}>> = {};

  topicPerformanceByDate.forEach((dateMap, topicId) => {
    topicMasteryOverTime[topicId] = Array.from(dateMap.entries()).map(([dateStr, scores]) => {
      return {
        date: new Date(dateStr),
        value: scores.reduce((sum, score) => sum + score, 0) / scores.length
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  return {
    performanceOverTime,
    completionRateOverTime,
    topicMasteryOverTime
  };
}