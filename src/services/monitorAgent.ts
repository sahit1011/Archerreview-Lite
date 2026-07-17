import {
  User,
  Task,
  Performance,
  StudyPlan,
  Alert,
  ReadinessScore,
  Topic
} from '../models/index'; // Changed to relative path
import mongoose from 'mongoose';
import dbConnect from '../lib/db'; // Changed to relative path
import { calculateReadinessScore } from '../lib/dbUtils'; // Changed to relative path
import { generateLLMInsights, generateAlertsFromInsights } from './monitorAgentLLM'; // Changed to relative path

/**
 * MonitorAgent - Responsible for tracking progress and performance
 *
 * This service handles:
 * 1. Tracking task completion and performance metrics
 * 2. Detecting deviations from the study plan
 * 3. Identifying patterns in study behavior
 * 4. Generating alerts for the Adaptation Agent
 * 5. Processing real-time data
 */

// Thresholds for generating alerts
const THRESHOLDS = {
  MISSED_TASKS_PERCENTAGE: 20, // Alert if more than 20% of tasks are missed
  LOW_PERFORMANCE_SCORE: 60, // Alert if performance score is below 60%
  CONSECUTIVE_MISSED_TASKS: 3, // Alert if 3 or more consecutive tasks are missed
  SCHEDULE_DEVIATION_DAYS: 2, // Alert if tasks are consistently completed 2+ days late
  TOPIC_DIFFICULTY_THRESHOLD: 50, // Alert if performance on a topic is below 50%
  READINESS_SCORE_THRESHOLD: 65 // Alert if readiness score is below 65%
};

// Types of monitoring data
interface MonitoringResult {
  userId: string;
  planId: string;
  alerts: AlertData[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    missedTasks: number;
    upcomingTasks: number;
    averagePerformance: number;
    averageConfidence: number;
    readinessScore: number;
  };
  llmInsights?: {
    insights: Array<{
      type: 'STRENGTH' | 'WEAKNESS' | 'PATTERN' | 'PREDICTION' | 'RECOMMENDATION';
      description: string;
      confidence: number;
      relatedTopicId?: string;
      relatedTaskId?: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
      metadata?: Record<string, any>;
    }>;
    naturalLanguageSummary: string;
    confidence: number;
    generatedAt: Date;
  };
}

interface AlertData {
  type: 'MISSED_TASK' | 'LOW_PERFORMANCE' | 'SCHEDULE_DEVIATION' | 'TOPIC_DIFFICULTY' | 'STUDY_PATTERN' | 'GENERAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  relatedTaskId?: string;
  relatedTopicId?: string;
  metadata?: Record<string, any>;
}

/**
 * Run the monitor agent for a specific user
 * @param userId User ID to monitor
 * @returns Monitoring results including alerts and statistics
 */
export async function runMonitorAgent(userId: string): Promise<MonitoringResult> {
  await dbConnect();

  try {
    // Get user and study plan
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const studyPlan = await StudyPlan.findOne({ user: userId });
    if (!studyPlan) {
      throw new Error(`Study plan not found for user: ${userId}`);
    }

    // Initialize monitoring result
    const result: MonitoringResult = {
      userId,
      planId: studyPlan._id.toString(),
      alerts: [],
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        missedTasks: 0,
        upcomingTasks: 0,
        averagePerformance: 0,
        averageConfidence: 0,
        readinessScore: 0
      }
    };

    // Get all tasks for the user's study plan
    const tasks = await Task.find({ plan: studyPlan._id }).sort({ startTime: 1 });

    // Get all performances for the user
    const performances = await Performance.find({ user: userId });

    // Get or calculate readiness score
    let readinessScore = await ReadinessScore.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!readinessScore) {
      readinessScore = await calculateReadinessScore(userId);
    }

    // Update basic statistics
    result.stats.totalTasks = tasks.length;
    result.stats.completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
    result.stats.missedTasks = tasks.filter(task =>
      task.status === 'PENDING' && new Date(task.endTime) < new Date()
    ).length;
    result.stats.upcomingTasks = tasks.filter(task =>
      task.status === 'PENDING' && new Date(task.startTime) > new Date()
    ).length;

    // Calculate average performance and confidence
    if (performances.length > 0) {
      const totalScore = performances.reduce((sum: number, perf: { score?: number }) => sum + (perf.score || 0), 0);
      const totalConfidence = performances.reduce((sum: number, perf: { confidence: number }) => sum + perf.confidence, 0);

      result.stats.averagePerformance = totalScore / performances.length;
      result.stats.averageConfidence = totalConfidence / performances.length;
    }

    // Set readiness score
    if (readinessScore) {
      result.stats.readinessScore = readinessScore.overallScore;
    }

    // Mongoose types studyPlan._id as `unknown`; it is an ObjectId at runtime.
    const planId = studyPlan._id as mongoose.Types.ObjectId;

    // Run rule-based monitoring checks
    await Promise.all([
      checkMissedTasks(userId, planId, tasks, result),
      checkPerformance(userId, planId, performances, result),
      checkScheduleDeviations(userId, planId, tasks, performances, result),
      checkTopicDifficulties(userId, planId, performances, result),
      checkStudyPatterns(userId, planId, tasks, performances, result),
      checkReadinessScore(userId, planId, readinessScore, result)
    ]);

    // Save rule-based alerts to database
    await saveAlerts(userId, planId, result.alerts);

    // Check if we should use LLM enhancements
    const useLLM = process.env.USE_LLM_MONITOR === 'true';

    if (useLLM) {
      try {
        console.log(`[MonitorAgent] Generating LLM insights for user ${userId}`);

        // Generate LLM insights based on the rule-based monitoring results
        const llmInsights = await generateLLMInsights(userId, result);

        // Add LLM-generated insights to the result
        result.llmInsights = llmInsights;

        // Generate additional alerts from LLM insights
        const llmAlerts = await generateAlertsFromInsights(userId, planId, llmInsights.insights);

        console.log(`[MonitorAgent] Generated ${llmAlerts.length} LLM-based alerts for user ${userId}`);
      } catch (llmError) {
        console.error('[MonitorAgent] Error generating LLM insights:', llmError);
        // Continue with rule-based results if LLM fails
      }
    }

    return result;
  } catch (error) {
    console.error('Error running monitor agent:', error);
    throw error;
  }
}

/**
 * Check for missed tasks and generate alerts
 */
async function checkMissedTasks(
  userId: string,
  planId: mongoose.Types.ObjectId,
  tasks: any[],
  result: MonitoringResult
): Promise<void> {
  // Calculate missed tasks percentage
  const missedPercentage = (result.stats.missedTasks / result.stats.totalTasks) * 100;

  // Check if missed tasks percentage exceeds threshold
  if (missedPercentage >= THRESHOLDS.MISSED_TASKS_PERCENTAGE) {
    result.alerts.push({
      type: 'MISSED_TASK',
      severity: missedPercentage >= 30 ? 'HIGH' : 'MEDIUM',
      message: `${Math.round(missedPercentage)}% of tasks have been missed. Consider adjusting the schedule.`,
      metadata: {
        missedPercentage,
        missedCount: result.stats.missedTasks,
        totalCount: result.stats.totalTasks
      }
    });
  }

  // Check for consecutive missed tasks
  let consecutiveMissed = 0;
  let maxConsecutiveMissed = 0;
  let lastMissedTask = null;

  // Sort tasks by start time
  const sortedTasks = [...tasks].sort((a, b) =>
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Find consecutive missed tasks
  for (const task of sortedTasks) {
    const isPastDue = new Date(task.endTime) < new Date();

    if (task.status === 'PENDING' && isPastDue) {
      consecutiveMissed++;
      lastMissedTask = task;
    } else if (task.status === 'COMPLETED' || task.status === 'SKIPPED') {
      // Reset counter when a task is completed or skipped
      consecutiveMissed = 0;
    }

    // Update max consecutive missed
    maxConsecutiveMissed = Math.max(maxConsecutiveMissed, consecutiveMissed);
  }

  // Generate alert if consecutive missed tasks exceed threshold
  if (maxConsecutiveMissed >= THRESHOLDS.CONSECUTIVE_MISSED_TASKS && lastMissedTask) {
    result.alerts.push({
      type: 'MISSED_TASK',
      severity: 'HIGH',
      message: `${maxConsecutiveMissed} consecutive tasks have been missed. Immediate attention required.`,
      relatedTaskId: lastMissedTask._id.toString(),
      relatedTopicId: lastMissedTask.topic.toString(),
      metadata: {
        consecutiveMissed: maxConsecutiveMissed,
        lastMissedTaskTitle: lastMissedTask.title
      }
    });
  }

  // Generate individual alerts for each missed task
  // This is important for the adaptation agent to reschedule each task
  const missedTasks = tasks.filter(task =>
    task.status === 'PENDING' && new Date(task.endTime) < new Date()
  );

  for (const missedTask of missedTasks) {
    // Check if there's already an alert for this task
    const existingAlert = await Alert.findOne({
      user: userId,
      relatedTask: missedTask._id,
      type: 'MISSED_TASK',
      isResolved: false
    });

    // Only create a new alert if one doesn't already exist
    if (!existingAlert) {
      result.alerts.push({
        type: 'MISSED_TASK',
        severity: 'MEDIUM',
        message: `Missed task: "${missedTask.title}". This task needs to be rescheduled.`,
        relatedTaskId: missedTask._id.toString(),
        relatedTopicId: missedTask.topic.toString(),
        metadata: {
          taskTitle: missedTask.title,
          originalStartTime: missedTask.startTime,
          originalEndTime: missedTask.endTime,
          daysMissed: Math.ceil((new Date().getTime() - new Date(missedTask.endTime).getTime()) / (1000 * 60 * 60 * 24))
        }
      });
    }
  }
}

/**
 * Check performance metrics and generate alerts
 */
async function checkPerformance(
  userId: string,
  planId: mongoose.Types.ObjectId,
  performances: any[],
  result: MonitoringResult
): Promise<void> {
  // Skip if no performances recorded
  if (performances.length === 0) return;

  // Check if average performance is below threshold
  if (result.stats.averagePerformance < THRESHOLDS.LOW_PERFORMANCE_SCORE) {
    result.alerts.push({
      type: 'LOW_PERFORMANCE',
      severity: result.stats.averagePerformance < 50 ? 'HIGH' : 'MEDIUM',
      message: `Overall performance is below target (${Math.round(result.stats.averagePerformance)}%). Consider reviewing difficult topics.`,
      metadata: {
        averagePerformance: result.stats.averagePerformance,
        threshold: THRESHOLDS.LOW_PERFORMANCE_SCORE
      }
    });
  }

  // Check for declining performance trend
  if (performances.length >= 5) {
    // Sort performances by date
    const sortedPerformances = [...performances]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Get the 5 most recent performances
    const recentPerformances = sortedPerformances.slice(-5);

    // Calculate average score for first half and second half
    const firstHalfAvg = (recentPerformances[0].score || 0) + (recentPerformances[1].score || 0);
    const secondHalfAvg = (recentPerformances[3].score || 0) + (recentPerformances[4].score || 0);

    // Check if there's a significant decline (10% or more)
    if (secondHalfAvg < firstHalfAvg * 0.9) {
      result.alerts.push({
        type: 'LOW_PERFORMANCE',
        severity: 'MEDIUM',
        message: 'Performance is declining in recent tasks. Consider adjusting study approach.',
        metadata: {
          recentScores: recentPerformances.map(p => p.score || 0),
          trend: 'declining'
        }
      });
    }
  }
}

/**
 * Check for schedule deviations and generate alerts
 */
async function checkScheduleDeviations(
  userId: string,
  planId: mongoose.Types.ObjectId,
  tasks: any[],
  performances: any[],
  result: MonitoringResult
): Promise<void> {
  // Create a map of task completions
  const taskCompletions = new Map();

  // Populate task completion data
  performances.forEach(perf => {
    if (perf.completed && perf.task) {
      taskCompletions.set(perf.task.toString(), {
        completedAt: perf.createdAt,
        taskId: perf.task
      });
    }
  });

  // Track schedule deviations
  let totalDeviation = 0;
  let deviationCount = 0;
  let maxDeviation = 0;
  let maxDeviationTask = null;

  // Check completed tasks for schedule deviations
  tasks.forEach(task => {
    if (task.status === 'COMPLETED' && taskCompletions.has(task._id.toString())) {
      const completion = taskCompletions.get(task._id.toString());
      const scheduledEnd = new Date(task.endTime);
      const completedAt = new Date(completion.completedAt);

      // Calculate deviation in days
      const deviationDays = (completedAt.getTime() - scheduledEnd.getTime()) / (1000 * 60 * 60 * 24);

      // Only count positive deviations (tasks completed late)
      if (deviationDays > 0) {
        totalDeviation += deviationDays;
        deviationCount++;

        // Track maximum deviation
        if (deviationDays > maxDeviation) {
          maxDeviation = deviationDays;
          maxDeviationTask = task;
        }
      }
    }
  });

  // Calculate average deviation
  const avgDeviation = deviationCount > 0 ? totalDeviation / deviationCount : 0;

  // Generate alert if average deviation exceeds threshold
  if (avgDeviation >= THRESHOLDS.SCHEDULE_DEVIATION_DAYS) {
    result.alerts.push({
      type: 'SCHEDULE_DEVIATION',
      severity: avgDeviation >= 3 ? 'HIGH' : 'MEDIUM',
      message: `Tasks are completed an average of ${avgDeviation.toFixed(1)} days behind schedule. Consider adjusting the plan.`,
      relatedTaskId: maxDeviationTask ? (maxDeviationTask as any)._id.toString() : undefined,
      metadata: {
        averageDeviation: avgDeviation,
        maxDeviation,
        deviationCount
      }
    });
  }
}

/**
 * Check for topic difficulties and generate alerts
 */
async function checkTopicDifficulties(
  userId: string,
  planId: mongoose.Types.ObjectId,
  performances: any[],
  result: MonitoringResult
): Promise<void> {
  // Group performances by topic
  const topicPerformances = new Map();

  // Populate topic performance data
  for (const perf of performances) {
    if (!perf.topic) continue;

    const topicId = perf.topic.toString();
    if (!topicPerformances.has(topicId)) {
      topicPerformances.set(topicId, []);
    }

    topicPerformances.get(topicId).push({
      score: perf.score || 0,
      confidence: perf.confidence,
      timeSpent: perf.timeSpent
    });
  }

  // Check each topic for difficulties
  const difficultTopics = [];

  for (const [topicId, perfs] of topicPerformances.entries()) {
    // Calculate average score for the topic
    const totalScore = (perfs as { score: number }[]).reduce((sum: number, p: { score: number }) => sum + p.score, 0);
    const avgScore = perfs.length > 0 ? totalScore / perfs.length : 0;

    // Check if average score is below threshold
    if (avgScore < THRESHOLDS.TOPIC_DIFFICULTY_THRESHOLD) {
      // Get topic details
      const topic = await Topic.findById(topicId);

      difficultTopics.push({
        topicId,
        name: topic ? topic.name : 'Unknown Topic',
        avgScore,
        performanceCount: perfs.length
      });
    }
  }

  // Generate alerts for difficult topics
  for (const topic of difficultTopics) {
    result.alerts.push({
      type: 'TOPIC_DIFFICULTY',
      severity: topic.avgScore < 40 ? 'HIGH' : 'MEDIUM',
      message: `Low performance detected in topic: ${topic.name} (${Math.round(topic.avgScore)}%). Additional practice recommended.`,
      relatedTopicId: topic.topicId,
      metadata: {
        topicName: topic.name,
        averageScore: topic.avgScore,
        performanceCount: topic.performanceCount
      }
    });
  }
}

/**
 * Check for study patterns and generate alerts
 */
async function checkStudyPatterns(
  userId: string,
  planId: mongoose.Types.ObjectId,
  tasks: any[],
  performances: any[],
  result: MonitoringResult
): Promise<void> {
  // Skip if not enough data
  if (performances.length < 5) return;

  // Analyze time of day patterns
  const timeOfDayDistribution = {
    morning: 0, // 5am - 12pm
    afternoon: 0, // 12pm - 5pm
    evening: 0, // 5pm - 10pm
    night: 0 // 10pm - 5am
  };

  // Count completions by time of day
  performances.forEach(perf => {
    const completedAt = new Date(perf.createdAt);
    const hour = completedAt.getHours();

    if (hour >= 5 && hour < 12) {
      timeOfDayDistribution.morning++;
    } else if (hour >= 12 && hour < 17) {
      timeOfDayDistribution.afternoon++;
    } else if (hour >= 17 && hour < 22) {
      timeOfDayDistribution.evening++;
    } else {
      timeOfDayDistribution.night++;
    }
  });

  // Find preferred study time
  const total = performances.length;
  const preferredTime = Object.entries(timeOfDayDistribution)
    .sort((a, b) => b[1] - a[1])[0];

  const preferredTimePercentage = (preferredTime[1] / total) * 100;

  // Check if user preference matches actual study pattern
  const userPreferredTime = (await User.findById(userId))?.preferences?.preferredStudyTime || 'morning';

  if (preferredTimePercentage > 60 && preferredTime[0] !== userPreferredTime) {
    result.alerts.push({
      type: 'STUDY_PATTERN',
      severity: 'LOW',
      message: `You consistently study during ${preferredTime[0]} hours (${Math.round(preferredTimePercentage)}% of the time). Consider updating your preferred study time.`,
      metadata: {
        actualPattern: preferredTime[0],
        userPreference: userPreferredTime,
        timeDistribution: timeOfDayDistribution
      }
    });
  }

  // Check for inconsistent study patterns
  const daysBetweenSessions = [];
  const sortedPerformances = [...performances].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Calculate days between study sessions
  for (let i = 1; i < sortedPerformances.length; i++) {
    const current = new Date(sortedPerformances[i].createdAt);
    const previous = new Date(sortedPerformances[i-1].createdAt);

    // Only count if they're different days
    if (current.toDateString() !== previous.toDateString()) {
      const daysDiff = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);
      daysBetweenSessions.push(daysDiff);
    }
  }

  // Check for large gaps between study sessions
  if (daysBetweenSessions.length > 0) {
    const maxGap = Math.max(...daysBetweenSessions);

    if (maxGap > 3) {
      result.alerts.push({
        type: 'STUDY_PATTERN',
        severity: maxGap > 5 ? 'MEDIUM' : 'LOW',
        message: `There was a ${Math.round(maxGap)}-day gap between study sessions. Consistent daily practice is recommended.`,
        metadata: {
          maxGap,
          averageGap: daysBetweenSessions.reduce((sum, days) => sum + days, 0) / daysBetweenSessions.length
        }
      });
    }
  }
}

/**
 * Check readiness score and generate alerts
 */
async function checkReadinessScore(
  userId: string,
  planId: mongoose.Types.ObjectId,
  readinessScore: any,
  result: MonitoringResult
): Promise<void> {
  // Skip if no readiness score
  if (!readinessScore) return;

  // Check if readiness score is below threshold
  if (readinessScore.overallScore < THRESHOLDS.READINESS_SCORE_THRESHOLD) {
    // Get exam date
    const studyPlan = await StudyPlan.findById(planId);
    const examDate = studyPlan ? studyPlan.examDate : null;

    // Calculate days until exam
    const daysUntilExam = examDate
      ? Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    // Determine severity based on days until exam
    let severity = 'MEDIUM';
    if (daysUntilExam !== null) {
      if (daysUntilExam < 14) {
        severity = 'HIGH';
      } else if (daysUntilExam > 30) {
        severity = 'LOW';
      }
    }

    result.alerts.push({
      type: 'GENERAL',
      severity: severity as 'LOW' | 'MEDIUM' | 'HIGH',
      message: `Your readiness score (${Math.round(readinessScore.overallScore)}%) is below the target threshold. Focus on weak areas to improve.`,
      metadata: {
        readinessScore: readinessScore.overallScore,
        threshold: THRESHOLDS.READINESS_SCORE_THRESHOLD,
        daysUntilExam
      }
    });

    // Add alerts for weak categories
    const weakCategories = readinessScore.categoryScores
      .filter((cs: any) => cs.score < THRESHOLDS.READINESS_SCORE_THRESHOLD)
      .sort((a: any, b: any) => a.score - b.score);

    if (weakCategories.length > 0) {
      const weakestCategory = weakCategories[0];

      result.alerts.push({
        type: 'GENERAL',
        severity: 'MEDIUM',
        message: `Your performance in ${formatCategoryName(weakestCategory.category)} is particularly low (${Math.round(weakestCategory.score)}%). Prioritize this area.`,
        metadata: {
          category: weakestCategory.category,
          score: weakestCategory.score
        }
      });
    }
  }
}

/**
 * Save alerts to the database
 */
async function saveAlerts(
  userId: string,
  planId: mongoose.Types.ObjectId,
  alerts: AlertData[]
): Promise<void> {
  // Skip if no alerts
  if (alerts.length === 0) return;

  // Create alert documents
  const alertDocs = alerts.map(alert => ({
    user: userId,
    plan: planId,
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    relatedTask: alert.relatedTaskId,
    relatedTopic: alert.relatedTopicId,
    metadata: alert.metadata,
    isResolved: false
  }));

  // Save alerts to database
  await Alert.insertMany(alertDocs);
}

/**
 * Format category name for display
 */
function formatCategoryName(category: string): string {
  return category
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get all unresolved alerts for a user
 * @param userId User ID
 * @returns Array of unresolved alerts
 */
export async function getUnresolvedAlerts(userId: string): Promise<any[]> {
  await dbConnect();

  return Alert.find({
    user: userId,
    isResolved: false
  })
  .populate('relatedTask')
  .populate('relatedTopic')
  .sort({ createdAt: -1 });
}

/**
 * Mark an alert as resolved
 * @param alertId Alert ID
 * @returns Updated alert
 */
export async function resolveAlert(alertId: string): Promise<any> {
  await dbConnect();

  return Alert.findByIdAndUpdate(
    alertId,
    {
      isResolved: true,
      resolvedAt: new Date()
    },
    { new: true }
  );
}

/**
 * Get monitoring statistics for a user
 * @param userId User ID
 * @returns Monitoring statistics
 */
export async function getMonitoringStats(userId: string): Promise<any> {
  await dbConnect();

  try {
    // Get user and study plan
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const studyPlan = await StudyPlan.findOne({ user: userId });
    if (!studyPlan) {
      throw new Error(`Study plan not found for user: ${userId}`);
    }

    // Get all tasks for the user's study plan
    const tasks = await Task.find({ plan: studyPlan._id });

    // Get all performances for the user
    const performances = await Performance.find({ user: userId });

    // Get readiness score (latest) and full readiness history (for projection)
    const readinessScore = await ReadinessScore.findOne({ user: userId }).sort({ createdAt: -1 });
    const readinessHistory = await ReadinessScore.find({ user: userId }).sort({ createdAt: 1 });

    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
    const missedTasks = tasks.filter(task =>
      task.status === 'PENDING' && new Date(task.endTime) < new Date()
    ).length;
    const upcomingTasks = tasks.filter(task =>
      task.status === 'PENDING' && new Date(task.startTime) > new Date()
    ).length;

    // Calculate average performance and confidence
    let averagePerformance = 0;
    let averageConfidence = 0;

    if (performances.length > 0) {
      const totalScore = performances.reduce((sum: number, perf: { score?: number }) => sum + (perf.score || 0), 0);
      const totalConfidence = performances.reduce((sum: number, perf: { confidence: number }) => sum + perf.confidence, 0);

      averagePerformance = totalScore / performances.length;
      averageConfidence = totalConfidence / performances.length;
    }

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate days until exam
    const daysUntilExam = Math.ceil((new Date(studyPlan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // ----------------------------------------------------------------------
    // Real analytics computed from the database for this user.
    // When there is no data yet, we return empty arrays / zeros (honest),
    // never fabricated values.
    // ----------------------------------------------------------------------

    // Performances that carry a numeric score (i.e. graded quizzes), sorted oldest -> newest.
    const scoredPerformances = performances
      .filter((p: any) => typeof p.score === 'number')
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // All performances sorted oldest -> newest (used for time-based aggregations).
    const sortedPerformances = [...performances]
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // --- performanceTrend: average score over the last ~8 daily buckets ---
    // Group scored performances by calendar day, average per day, take the most recent 8 days.
    const performanceTrend: number[] = (() => {
      if (scoredPerformances.length === 0) return [];
      const byDay = new Map<string, { sum: number; count: number }>();
      for (const p of scoredPerformances) {
        const dayKey = new Date(p.createdAt).toISOString().split('T')[0];
        const bucket = byDay.get(dayKey) || { sum: 0, count: 0 };
        bucket.sum += p.score as number;
        bucket.count += 1;
        byDay.set(dayKey, bucket);
      }
      const orderedDays = Array.from(byDay.keys()).sort();
      const last8 = orderedDays.slice(-8);
      return last8.map(day => {
        const b = byDay.get(day)!;
        return Math.round(b.sum / b.count);
      });
    })();

    // --- studyPatterns: distribution of study activity by time of day ---
    const studyPatterns = (() => {
      if (performances.length === 0) {
        return [] as { timeOfDay: string; percentage: number }[];
      }
      const buckets = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
      for (const p of performances) {
        const hour = new Date(p.createdAt).getHours();
        if (hour >= 5 && hour < 12) buckets.Morning++;
        else if (hour >= 12 && hour < 17) buckets.Afternoon++;
        else if (hour >= 17 && hour < 22) buckets.Evening++;
        else buckets.Night++;
      }
      const total = performances.length;
      return (['Morning', 'Afternoon', 'Evening', 'Night'] as const).map(timeOfDay => ({
        timeOfDay,
        percentage: Math.round((buckets[timeOfDay] / total) * 100)
      }));
    })();

    // --- studyConsistency: total hours studied per day of week ---
    const studyConsistency = (() => {
      if (performances.length === 0) {
        return [] as { day: string; hours: number }[];
      }
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const minutesByDow = [0, 0, 0, 0, 0, 0, 0];
      for (const p of performances) {
        const dow = new Date(p.createdAt).getDay();
        minutesByDow[dow] += p.timeSpent || 0;
      }
      // Output Mon -> Sun ordering (matches the previous shape's intent).
      const order = [1, 2, 3, 4, 5, 6, 0];
      return order.map(dow => ({
        day: dayLabels[dow],
        hours: Math.round((minutesByDow[dow] / 60) * 10) / 10
      }));
    })();

    // --- scheduleAdherence: how completed tasks lined up with their due dates ---
    // onTime + late + missed are expressed as percentages of (completed + missed) tasks.
    const scheduleAdherence = (() => {
      // Map task completion times from performance records.
      const completionByTask = new Map<string, Date>();
      for (const p of performances) {
        if (p.completed && p.task) {
          completionByTask.set(p.task.toString(), new Date(p.createdAt));
        }
      }

      let onTimeCount = 0;
      let lateCount = 0;
      const now = new Date();
      const missedCount = tasks.filter((t: any) =>
        t.status === 'PENDING' && new Date(t.endTime) < now
      ).length;

      for (const t of tasks) {
        if (t.status !== 'COMPLETED') continue;
        const completedAt = completionByTask.get(t._id.toString());
        const dueDate = t.endTime ? new Date(t.endTime) : null;
        if (completedAt && dueDate) {
          if (completedAt.getTime() <= dueDate.getTime()) onTimeCount++;
          else lateCount++;
        } else {
          // Completed but no timestamp/due reference: count as on time.
          onTimeCount++;
        }
      }

      const denom = onTimeCount + lateCount + missedCount;
      if (denom === 0) {
        return { onTime: 0, late: 0, missed: 0 };
      }
      return {
        onTime: Math.round((onTimeCount / denom) * 100),
        late: Math.round((lateCount / denom) * 100),
        missed: Math.round((missedCount / denom) * 100)
      };
    })();

    // --- sessionDurations: distribution of study session lengths ---
    const sessionDurations = (() => {
      if (performances.length === 0) {
        return [] as { duration: string; percentage: number }[];
      }
      const buckets = { '< 30 min': 0, '30-60 min': 0, '1-2 hours': 0, '> 2 hours': 0 };
      for (const p of performances) {
        const mins = p.timeSpent || 0;
        if (mins < 30) buckets['< 30 min']++;
        else if (mins < 60) buckets['30-60 min']++;
        else if (mins < 120) buckets['1-2 hours']++;
        else buckets['> 2 hours']++;
      }
      const total = performances.length;
      return (['< 30 min', '30-60 min', '1-2 hours', '> 2 hours'] as const).map(duration => ({
        duration,
        percentage: Math.round((buckets[duration] / total) * 100)
      }));
    })();

    // --- topicPerformance & topicTimeInvestment: per-topic aggregations ---
    // Group performances by topic, average score and sum time spent, join Topic for names.
    const topicAgg = new Map<string, { scoreSum: number; scoreCount: number; minutes: number }>();
    for (const p of performances) {
      if (!p.topic) continue;
      const topicId = p.topic.toString();
      const agg = topicAgg.get(topicId) || { scoreSum: 0, scoreCount: 0, minutes: 0 };
      if (typeof p.score === 'number') {
        agg.scoreSum += p.score;
        agg.scoreCount += 1;
      }
      agg.minutes += p.timeSpent || 0;
      topicAgg.set(topicId, agg);
    }

    // Resolve topic names in one query.
    const topicIds = Array.from(topicAgg.keys());
    const topicDocs = topicIds.length > 0
      ? await Topic.find({ _id: { $in: topicIds } })
      : [];
    const topicNameById = new Map<string, string>();
    for (const t of topicDocs) {
      topicNameById.set(t._id.toString(), t.name);
    }

    const topicPerformance = topicIds
      .filter(id => (topicAgg.get(id) as any).scoreCount > 0)
      .map(id => {
        const agg = topicAgg.get(id)!;
        return {
          topicName: topicNameById.get(id) || 'Unknown Topic',
          score: Math.round(agg.scoreSum / agg.scoreCount)
        };
      })
      .sort((a, b) => a.score - b.score);

    const topicTimeInvestment = topicIds
      .map(id => {
        const agg = topicAgg.get(id)!;
        return {
          topic: topicNameById.get(id) || 'Unknown Topic',
          timeSpent: Math.round((agg.minutes / 60) * 10) / 10, // hours
          performance: agg.scoreCount > 0 ? Math.round(agg.scoreSum / agg.scoreCount) : 0
        };
      })
      .sort((a, b) => b.timeSpent - a.timeSpent);

    // --- readinessProjection: actual readiness scores over time (weekly buckets) ---
    // Built from the user's recorded ReadinessScore history; no fabricated projection.
    const readinessProjection = (() => {
      if (readinessHistory.length === 0) {
        return [] as { week: number; actual?: number; projected?: number }[];
      }
      const byWeek = new Map<string, { sum: number; count: number; ts: number }>();
      for (const r of readinessHistory) {
        const d = new Date(r.createdAt);
        // ISO-ish year-week key.
        const year = d.getUTCFullYear();
        const firstDay = new Date(Date.UTC(year, 0, 1));
        const weekNum = Math.floor(
          ((d.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24) + firstDay.getUTCDay()) / 7
        );
        const key = `${year}-${weekNum}`;
        const bucket = byWeek.get(key) || { sum: 0, count: 0, ts: d.getTime() };
        bucket.sum += r.overallScore;
        bucket.count += 1;
        bucket.ts = Math.min(bucket.ts, d.getTime());
        byWeek.set(key, bucket);
      }
      const orderedKeys = Array.from(byWeek.entries())
        .sort((a, b) => a[1].ts - b[1].ts)
        .map(([key]) => key)
        .slice(-8);
      return orderedKeys.map((key, index) => {
        const b = byWeek.get(key)!;
        return { week: index + 1, actual: Math.round(b.sum / b.count) };
      });
    })();

    // --- readinessBreakdown: honest breakdown from real metrics ---
    // Knowledge = average quiz score; Confidence = avg confidence scaled to 0-100;
    // TimeManagement = task completion rate; TestStrategy = answer-level accuracy
    // across recorded quiz answers (falls back to 0 when no answers exist).
    const readinessBreakdown = (() => {
      let answerCorrect = 0;
      let answerTotal = 0;
      for (const p of performances) {
        if (Array.isArray(p.answers)) {
          for (const a of p.answers) {
            answerTotal += 1;
            if (a.isCorrect) answerCorrect += 1;
          }
        }
      }
      const testStrategy = answerTotal > 0
        ? Math.round((answerCorrect / answerTotal) * 100)
        : 0;
      return {
        Knowledge: Math.round(averagePerformance),
        TestStrategy: testStrategy,
        TimeManagement: Math.round(completionRate),
        Confidence: Math.round(averageConfidence * 20) // 1-5 scale -> 0-100
      };
    })();

    // Return statistics with real, database-derived analytics.
    return {
      totalTasks,
      completedTasks,
      missedTasks,
      upcomingTasks,
      averagePerformance,
      averageConfidence,
      completionRate,
      readinessScore: readinessScore ? readinessScore.overallScore : 0,
      daysUntilExam,
      examDate: studyPlan.examDate,
      // Real analytics for visualization (empty arrays / zeros when no data yet)
      performanceTrend,
      studyPatterns,
      studyConsistency,
      scheduleAdherence,
      sessionDurations,
      topicPerformance,
      topicTimeInvestment,
      readinessProjection,
      readinessBreakdown
    };
  } catch (error) {
    console.error('Error getting monitoring stats:', error);
    throw error;
  }
}
