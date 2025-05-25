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

    // Run rule-based monitoring checks
    await Promise.all([
      checkMissedTasks(userId, studyPlan._id, tasks, result),
      checkPerformance(userId, studyPlan._id, performances, result),
      checkScheduleDeviations(userId, studyPlan._id, tasks, performances, result),
      checkTopicDifficulties(userId, studyPlan._id, performances, result),
      checkStudyPatterns(userId, studyPlan._id, tasks, performances, result),
      checkReadinessScore(userId, studyPlan._id, readinessScore, result)
    ]);

    // Save rule-based alerts to database
    await saveAlerts(userId, studyPlan._id, result.alerts);

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
        const llmAlerts = await generateAlertsFromInsights(userId, studyPlan._id, llmInsights.insights);

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

    // Get readiness score
    const readinessScore = await ReadinessScore.findOne({ user: userId }).sort({ createdAt: -1 });

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

    // Calculate mock data for visualization (in a real implementation, this would come from actual data)
    // This is just for demonstration purposes until real data is available
    const mockPerformanceTrend = [65, 68, 72, 70, 75, 73, 78];
    const mockStudyPatterns = [
      { timeOfDay: 'Morning', percentage: 15 },
      { timeOfDay: 'Afternoon', percentage: 45 },
      { timeOfDay: 'Evening', percentage: 30 },
      { timeOfDay: 'Night', percentage: 10 }
    ];
    const mockStudyConsistency = [
      { day: 'Mon', hours: 2.5 },
      { day: 'Tue', hours: 1.8 },
      { day: 'Wed', hours: 3.2 },
      { day: 'Thu', hours: 2.0 },
      { day: 'Fri', hours: 1.5 },
      { day: 'Sat', hours: 4.5 },
      { day: 'Sun', hours: 3.8 }
    ];
    const mockScheduleAdherence = {
      onTime: 68,
      late: 22,
      missed: 10
    };
    const mockSessionDurations = [
      { duration: '< 30 min', percentage: 15 },
      { duration: '30-60 min', percentage: 45 },
      { duration: '1-2 hours', percentage: 30 },
      { duration: '> 2 hours', percentage: 10 }
    ];
    const mockTopicPerformance = [
      { topicName: 'Management of Care', score: 65 },
      { topicName: 'Safety & Infection Control', score: 78 },
      { topicName: 'Health Promotion', score: 82 },
      { topicName: 'Psychosocial Integrity', score: 58 },
      { topicName: 'Basic Care & Comfort', score: 72 }
    ];
    const mockTopicTimeInvestment = [
      { topic: 'Management of Care', timeSpent: 12.5, performance: 65 },
      { topic: 'Safety & Infection Control', timeSpent: 8.2, performance: 78 },
      { topic: 'Health Promotion', timeSpent: 10.1, performance: 82 },
      { topic: 'Psychosocial Integrity', timeSpent: 5.5, performance: 58 },
      { topic: 'Basic Care & Comfort', timeSpent: 7.8, performance: 72 }
    ];
    const mockReadinessProjection = [
      { week: 1, actual: 45 },
      { week: 2, actual: 52 },
      { week: 3, actual: 58 },
      { week: 4, actual: 65 },
      { week: 5, actual: 72 },
      { week: 6, actual: 78 },
      { week: 7, projected: 82 },
      { week: 8, projected: 85 },
      { week: 9, projected: 88 }
    ];
    const mockReadinessBreakdown = {
      Knowledge: (readinessScore ? readinessScore.overallScore : 0) * 1.05,
      TestStrategy: (readinessScore ? readinessScore.overallScore : 0) * 0.92,
      TimeManagement: (readinessScore ? readinessScore.overallScore : 0) * 1.1,
      Confidence: (readinessScore ? readinessScore.overallScore : 0) * 0.85
    };

    // Return statistics with mock data for visualization
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
      // Include mock data for visualization
      performanceTrend: mockPerformanceTrend,
      studyPatterns: mockStudyPatterns,
      studyConsistency: mockStudyConsistency,
      scheduleAdherence: mockScheduleAdherence,
      sessionDurations: mockSessionDurations,
      topicPerformance: mockTopicPerformance,
      topicTimeInvestment: mockTopicTimeInvestment,
      readinessProjection: mockReadinessProjection,
      readinessBreakdown: mockReadinessBreakdown
    };
  } catch (error) {
    console.error('Error getting monitoring stats:', error);
    throw error;
  }
}
