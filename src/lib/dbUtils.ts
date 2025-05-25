import mongoose from 'mongoose'; // Import mongoose
import dbConnect from './db'; // Add .js
import {
  User,
  Topic,
  Content,
  StudyPlan,
  Task,
  Performance,
  ReadinessScore,
  DiagnosticResult
} from '../models/index'; // Add /index.js

/**
 * Connect to the database and return the models
 * @returns Object containing all models
 */
export async function getModels() {
  await dbConnect();
  return {
    User,
    Topic,
    Content,
    StudyPlan,
    Task,
    Performance,
    ReadinessScore,
    DiagnosticResult
  };
}

/**
 * Create a new user
 * @param userData User data
 * @returns Created user
 */
export async function createUser(userData: any) {
  await dbConnect();
  const user = new User(userData);
  await user.save();
  return user;
}

/**
 * Create a new study plan
 * @param planData Study plan data
 * @returns Created study plan
 */
export async function createStudyPlan(planData: any) {
  await dbConnect();
  const plan = new StudyPlan(planData);
  await plan.save();
  return plan;
}

/**
 * Create a new task
 * @param taskData Task data
 * @returns Created task
 */
export async function createTask(taskData: any) {
  await dbConnect();
  const task = new Task(taskData);
  await task.save();
  return task;
}

/**
 * Get user by ID
 * @param userId User ID
 * @returns User document
 */
export async function getUserById(userId: string) {
  await dbConnect();
  return User.findById(userId);
}

/**
 * Get study plan by user ID
 * @param userId User ID
 * @returns Study plan document
 */
export async function getStudyPlanByUserId(userId: string) {
  await dbConnect();
  return StudyPlan.findOne({ user: userId });
}

/**
 * Get tasks by plan ID
 * @param planId Study plan ID
 * @returns Array of task documents
 */
export async function getTasksByPlanId(planId: string) {
  await dbConnect();
  return Task.find({ plan: planId }).populate('topic').populate('content');
}

/**
 * Get tasks for today by user ID
 * @param userId User ID
 * @returns Array of task documents for today
 */
export async function getTodayTasksByUserId(userId: string) {
  await dbConnect();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const plan = await StudyPlan.findOne({ user: userId });
  if (!plan) return [];

  return Task.find({
    plan: plan._id,
    startTime: { $gte: today, $lt: tomorrow }
  }).populate('topic').populate('content');
}

/**
 * Get readiness score by user ID
 * @param userId User ID
 * @returns Readiness score document
 */
export async function getReadinessScoreByUserId(userId: string) {
  await dbConnect();
  return ReadinessScore.findOne({ user: userId }).sort({ createdAt: -1 });
}

/**
 * Get diagnostic result by user ID
 * @param userId User ID
 * @returns Diagnostic result document
 */
export async function getDiagnosticResultByUserId(userId: string) {
  await dbConnect();
  return DiagnosticResult.findOne({ user: userId }).sort({ createdAt: -1 });
}

/**
 * Get performance by user ID
 * @param userId User ID
 * @returns Array of performance documents
 */
export async function getPerformanceByUserId(userId: string) {
  await dbConnect();
  return Performance.find({ user: userId }).populate('topic').populate('task');
}

/**
 * Update task status
 * @param taskId Task ID
 * @param status New status
 * @returns Updated task
 */
export async function updateTaskStatus(taskId: string, status: string) {
  await dbConnect();
  return Task.findByIdAndUpdate(
    taskId,
    { status },
    { new: true }
  );
}

/**
 * Record performance for a task
 * @param performanceData Performance data
 * @returns Created performance document
 */
export async function recordPerformance(performanceData: any) {
  await dbConnect();
  const performance = new Performance(performanceData);
  await performance.save();

  // Update task status if completed
  if (performanceData.completed) {
    await updateTaskStatus(performanceData.task, 'COMPLETED');
  }

  return performance;
}

/**
 * Calculate and update readiness score for a user
 * @param userId User ID
 * @returns Updated readiness score
 */
export async function calculateReadinessScore(userId: string) {
  await dbConnect();

  // Get all performances for the user
  const performances = await Performance.find({ user: userId }).populate('topic');

  // Get the study plan
  const plan = await StudyPlan.findOne({ user: userId });
  if (!plan) return null;

  // Get all topics to analyze importance and difficulty
  const allTopics = await Topic.find({});

  // Define NCLEX category weights based on exam distribution
  const categoryWeights: Record<string, number> = {
    'MANAGEMENT_OF_CARE': 0.20, // 20% of NCLEX exam
    'SAFETY_AND_INFECTION_CONTROL': 0.15, // 15% of NCLEX exam
    'HEALTH_PROMOTION': 0.10, // 10% of NCLEX exam
    'PSYCHOSOCIAL_INTEGRITY': 0.10, // 10% of NCLEX exam
    'BASIC_CARE_AND_COMFORT': 0.10, // 10% of NCLEX exam
    'PHARMACOLOGICAL_THERAPIES': 0.15, // 15% of NCLEX exam
    'REDUCTION_OF_RISK_POTENTIAL': 0.10, // 10% of NCLEX exam
    'PHYSIOLOGICAL_ADAPTATION': 0.10 // 10% of NCLEX exam
  };

  // Calculate overall score and category scores
  const categoryScores: { category: string; score: number }[] = [];
  const categories = Object.keys(categoryWeights);

  // Calculate score for each category with weighted scoring
  for (const category of categories) {
    const categoryPerformances = performances.filter(p => p.topic.category === category);
    if (categoryPerformances.length === 0) {
      categoryScores.push({ category, score: 0 });
      continue;
    }

    // Calculate weighted score based on topic importance and difficulty
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const performance of categoryPerformances) {
      // Get topic importance and difficulty
      const topicImportance = performance.topic.importance || 5; // Default to 5 if not set
      const topicDifficulty = performance.topic.difficulty;

      // Calculate difficulty multiplier
      let difficultyMultiplier = 1.0;
      if (topicDifficulty === 'HARD') difficultyMultiplier = 1.3;
      else if (topicDifficulty === 'MEDIUM') difficultyMultiplier = 1.0;
      else if (topicDifficulty === 'EASY') difficultyMultiplier = 0.8;

      // Calculate weight for this performance
      const weight = topicImportance * difficultyMultiplier;

      // Add to total
      totalWeightedScore += (performance.score || 0) * weight;
      totalWeight += weight;
    }

    // Calculate average weighted score
    const avgScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    categoryScores.push({ category, score: avgScore });
  }

  // Calculate overall score with category weights
  let overallScore = 0;
  let totalWeight = 0;

  for (const categoryScore of categoryScores) {
    const weight = categoryWeights[categoryScore.category] || 0;
    overallScore += categoryScore.score * weight;
    totalWeight += weight;
  }

  // Normalize overall score
  overallScore = totalWeight > 0 ? overallScore / totalWeight : 0;

  // Round scores for better readability
  overallScore = Math.round(overallScore);
  for (let i = 0; i < categoryScores.length; i++) {
    categoryScores[i].score = Math.round(categoryScores[i].score);
  }

  // Identify weak and strong areas with enhanced criteria
  const weakAreas: mongoose.Types.ObjectId[] = [];
  const strongAreas: mongoose.Types.ObjectId[] = [];

  // Group performances by topic
  const topicPerformances: Record<string, any[]> = {};

  for (const performance of performances) {
    const topicId = performance.topic._id.toString();
    if (!topicPerformances[topicId]) {
      topicPerformances[topicId] = [];
    }
    topicPerformances[topicId].push(performance);
  }

  // Analyze each topic's performances
  for (const [topicId, topicPerfs] of Object.entries(topicPerformances)) {
    // Calculate average score and confidence
    const scores = topicPerfs.map(p => p.score || 0).filter(s => s > 0);
    const avgScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;

    const confidences = topicPerfs.map(p => p.confidence || 0);
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : 0;

    // Get topic details
    const topic = topicPerfs[0].topic;

    // Determine if this is a weak area
    if (
      (avgScore < 70) || // Low score
      (avgScore < 75 && topic.importance >= 8) || // Important topic with below average score
      (avgScore < 80 && topic.difficulty === 'HARD' && topic.importance >= 7) || // Hard and important topic
      (avgConfidence < 3 && avgScore < 80) // Low confidence and not great score
    ) {
      weakAreas.push(topic._id);
    }

    // Determine if this is a strong area
    if (
      (avgScore >= 85) || // High score
      (avgScore >= 80 && avgConfidence >= 4) || // Good score with high confidence
      (avgScore >= 75 && topic.difficulty === 'HARD' && avgConfidence >= 4) // Good score on hard topic with confidence
    ) {
      strongAreas.push(topic._id);
    }
  }

  // Calculate projected score with enhanced forecasting
  const daysUntilExam = Math.ceil((plan.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // Get total tasks and completed tasks to calculate completion rate
  const totalTasks = await Task.countDocuments({ plan: plan._id });
  const completedTasks = await Task.countDocuments({ plan: plan._id, status: 'COMPLETED' });
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  // Calculate improvement rate based on days until exam and completion rate
  // Higher completion rate = faster improvement
  const dailyImprovement = 0.3 + (completionRate * 0.4); // 0.3% to 0.7% improvement per day

  // Calculate projected improvement
  let projectedImprovement = Math.min(35, daysUntilExam * dailyImprovement);

  // Adjust based on weak areas - more weak areas means slower improvement
  const weakAreasPenalty = Math.min(10, weakAreas.length * 0.5);
  projectedImprovement = Math.max(0, projectedImprovement - weakAreasPenalty);

  // Calculate final projected score
  const projectedScore = Math.min(100, Math.round(overallScore + projectedImprovement));

  // Create or update readiness score
  const readinessScore = await ReadinessScore.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      plan: plan._id,
      overallScore,
      categoryScores,
      weakAreas,
      strongAreas,
      projectedScore
    },
    { new: true, upsert: true }
  );

  return readinessScore;
}
