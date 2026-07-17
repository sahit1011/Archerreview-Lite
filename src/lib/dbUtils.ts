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
 * Calculate and update readiness score for a user.
 *
 * Readiness is a weighted blend of four real signals derived from the user's
 * own data. It NEVER fabricates a score: when there is no quiz/task data the
 * relevant components contribute 0 and the overall number reflects that
 * honestly (a brand new user with a plan but no activity scores 0).
 *
 * Components (weights sum to 1.0):
 *   - quiz       (0.45): NEET/JEE-subject-weighted average of quiz Performance.score
 *   - mastery    (0.25): topic coverage x mastery across the plan's topics
 *   - completion (0.20): completed vs total Tasks in the user's StudyPlan
 *   - trend      (0.10): recent-half vs earlier-half quiz average (improving/declining)
 *
 * @param userId User ID
 * @returns Updated readiness score document (with a non-persisted `breakdown`
 *          field describing the component contributions), or null if the user
 *          has no study plan.
 */
export async function calculateReadinessScore(userId: string) {
  await dbConnect();

  // Get the study plan first - without a plan there is nothing to be ready for.
  const plan = await StudyPlan.findOne({ user: userId });
  if (!plan) return null;

  // Get all performances for the user (populated topic for category/importance).
  const performances = await Performance.find({ user: userId }).populate('topic');
  // Only quiz-style performances carry a numeric score; treat those as the
  // graded evidence used for the quiz/mastery/trend components.
  const scoredPerformances: any[] = (performances as any[]).filter(
    (p: any) => p.topic && typeof p.score === 'number'
  );

  // Subject weights mirror the user's actual exam composition:
  // NEET: Biology is half the paper (50/25/25). JEE: three equal papers.
  const examUser = await User.findById(userId).select('examType').lean();
  const examType = (examUser as any)?.examType === 'JEE' ? 'JEE' : 'NEET';
  const categoryWeights: Record<string, number> =
    examType === 'JEE'
      ? { PHYSICS: 1 / 3, CHEMISTRY: 1 / 3, MATHEMATICS: 1 / 3 }
      : { BIOLOGY: 0.5, PHYSICS: 0.25, CHEMISTRY: 0.25 };
  const categories = Object.keys(categoryWeights);

  // -------------------------------------------------------------------------
  // (a) QUIZ COMPONENT: NEET/JEE-subject-weighted average of quiz scores.
  // Per category we weight individual attempts by topic importance x difficulty
  // so harder/important topics count more; categories with no attempts are
  // reported as 0 and excluded from the quiz average (no fabrication).
  // -------------------------------------------------------------------------
  const categoryScores: { category: string; score: number }[] = [];
  const categoriesWithData = new Set<string>();

  for (const category of categories) {
    const categoryPerformances = scoredPerformances.filter(
      (p: any) => p.topic.category === category
    );
    if (categoryPerformances.length === 0) {
      categoryScores.push({ category, score: 0 });
      continue;
    }
    categoriesWithData.add(category);

    let totalWeightedScore = 0;
    let totalWeight = 0;
    for (const performance of categoryPerformances) {
      const topicImportance = performance.topic.importance || 5; // 1-10, default 5
      const topicDifficulty = performance.topic.difficulty;
      let difficultyMultiplier = 1.0;
      if (topicDifficulty === 'HARD') difficultyMultiplier = 1.3;
      else if (topicDifficulty === 'EASY') difficultyMultiplier = 0.8;
      const weight = topicImportance * difficultyMultiplier;
      totalWeightedScore += (performance.score || 0) * weight;
      totalWeight += weight;
    }
    const avgScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    categoryScores.push({ category, score: Math.round(avgScore) });
  }

  // Quiz component = exam-distribution-weighted average over categories that
  // actually have data (re-normalized so absent categories don't drag it down).
  let quizScore = 0;
  let quizWeightSeen = 0;
  for (const cs of categoryScores) {
    if (!categoriesWithData.has(cs.category)) continue;
    const w = categoryWeights[cs.category] || 0;
    quizScore += cs.score * w;
    quizWeightSeen += w;
  }
  quizScore = quizWeightSeen > 0 ? quizScore / quizWeightSeen : 0;

  // -------------------------------------------------------------------------
  // Per-topic aggregation (used for mastery, weak/strong areas, top-3 weakest).
  // -------------------------------------------------------------------------
  const topicPerformances: Record<string, any[]> = {};
  for (const performance of scoredPerformances) {
    const topicId = performance.topic._id.toString();
    if (!topicPerformances[topicId]) topicPerformances[topicId] = [];
    topicPerformances[topicId].push(performance);
  }

  type TopicStat = {
    topicId: mongoose.Types.ObjectId;
    name: string;
    category: string;
    importance: number;
    avgScore: number;
    avgConfidence: number;
  };
  const topicStats: TopicStat[] = [];
  for (const topicPerfs of Object.values(topicPerformances)) {
    const scores = topicPerfs.map(p => p.score || 0);
    const avgScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;
    const confidences = topicPerfs.map(p => p.confidence || 0);
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : 0;
    const topic = topicPerfs[0].topic;
    topicStats.push({
      topicId: topic._id,
      name: topic.name,
      category: topic.category,
      importance: topic.importance || 5,
      avgScore,
      avgConfidence
    });
  }

  // -------------------------------------------------------------------------
  // (b) MASTERY COMPONENT: topic coverage x mastery across the PLAN's topics.
  // Coverage = fraction of distinct plan topics the user has actually attempted.
  // Mastery  = importance-weighted average score over those attempted topics.
  // A user who aced 2 of 50 plan topics is not "ready", so we multiply mastery
  // by coverage. Falls back to all-topics if the plan has no tasks yet.
  // -------------------------------------------------------------------------
  const planTopicIds = await Task.distinct('topic', { plan: plan._id });
  const planTopicIdSet = new Set(planTopicIds.map((t: any) => t.toString()));
  const totalPlanTopics = planTopicIdSet.size;

  let masteryScore = 0;
  if (totalPlanTopics > 0) {
    const coveredStats = topicStats.filter(ts => planTopicIdSet.has(ts.topicId.toString()));
    const coverage = coveredStats.length / totalPlanTopics; // 0..1
    let masteryWeighted = 0;
    let masteryWeight = 0;
    for (const ts of coveredStats) {
      masteryWeighted += ts.avgScore * ts.importance;
      masteryWeight += ts.importance;
    }
    const masteryAvg = masteryWeight > 0 ? masteryWeighted / masteryWeight : 0;
    masteryScore = masteryAvg * coverage;
  } else if (topicStats.length > 0) {
    // No plan tasks yet: fall back to a plain importance-weighted topic average
    // (coverage unknown, so don't penalize for it).
    let w = 0;
    let ws = 0;
    for (const ts of topicStats) {
      ws += ts.avgScore * ts.importance;
      w += ts.importance;
    }
    masteryScore = w > 0 ? ws / w : 0;
  }

  // -------------------------------------------------------------------------
  // (c) COMPLETION COMPONENT: completed vs total Tasks in the user's plan.
  // -------------------------------------------------------------------------
  const totalTasks = await Task.countDocuments({ plan: plan._id });
  const completedTasks = await Task.countDocuments({ plan: plan._id, status: 'COMPLETED' });
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0; // 0..1
  const completionScore = completionRate * 100;

  // -------------------------------------------------------------------------
  // (d) TREND COMPONENT: recent-half vs earlier-half quiz average.
  // Mapped onto 0..100 around a 50 neutral midpoint so a flat trend neither
  // helps nor hurts; strong improvement lifts readiness, decline lowers it.
  // -------------------------------------------------------------------------
  let trendDirection: 'IMPROVING' | 'DECLINING' | 'STABLE' = 'STABLE';
  let trendScore = 50; // neutral when there isn't enough data to judge
  if (scoredPerformances.length >= 4) {
    const sorted = [...scoredPerformances].sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);
    const avg = (arr: any[]) =>
      arr.reduce((s, p) => s + (p.score || 0), 0) / (arr.length || 1);
    const firstAvg = avg(firstHalf);
    const secondAvg = avg(secondHalf);
    const delta = secondAvg - firstAvg; // percentage points
    if (delta > 2) trendDirection = 'IMPROVING';
    else if (delta < -2) trendDirection = 'DECLINING';
    else trendDirection = 'STABLE';
    // Scale: +/-20pp swing maps to the full 0..100 range around 50.
    trendScore = Math.max(0, Math.min(100, 50 + delta * 2.5));
  }

  // -------------------------------------------------------------------------
  // OVERALL: weighted blend of the four components (weights sum to 1.0).
  // -------------------------------------------------------------------------
  const COMPONENT_WEIGHTS = {
    quiz: 0.45,
    mastery: 0.25,
    completion: 0.20,
    trend: 0.10
  };

  const hasAnyData = scoredPerformances.length > 0 || totalTasks > 0;
  let overallScore = 0;
  if (hasAnyData) {
    overallScore =
      quizScore * COMPONENT_WEIGHTS.quiz +
      masteryScore * COMPONENT_WEIGHTS.mastery +
      completionScore * COMPONENT_WEIGHTS.completion +
      trendScore * COMPONENT_WEIGHTS.trend;
  }
  overallScore = Math.max(0, Math.min(100, Math.round(overallScore)));

  // -------------------------------------------------------------------------
  // Weak / strong areas + top-3 weakest topics (sorted weakest-first so any
  // consumer slicing weakAreas[0..3] gets the genuine top-3 weakest topics).
  // -------------------------------------------------------------------------
  const weakStats: TopicStat[] = [];
  const strongStats: TopicStat[] = [];
  for (const ts of topicStats) {
    const isWeak =
      ts.avgScore < 70 ||
      (ts.avgScore < 75 && ts.importance >= 8) ||
      (ts.avgConfidence < 3 && ts.avgScore < 80);
    const isStrong =
      ts.avgScore >= 85 ||
      (ts.avgScore >= 80 && ts.avgConfidence >= 4);
    if (isWeak) weakStats.push(ts);
    else if (isStrong) strongStats.push(ts);
  }
  // Weakest first.
  weakStats.sort((a, b) => a.avgScore - b.avgScore);
  // Strongest first.
  strongStats.sort((a, b) => b.avgScore - a.avgScore);

  const weakAreas: mongoose.Types.ObjectId[] = weakStats.map(s => s.topicId);
  const strongAreas: mongoose.Types.ObjectId[] = strongStats.map(s => s.topicId);
  const topWeakTopics = weakStats.slice(0, 3).map(s => ({
    topic: s.topicId,
    name: s.name,
    category: s.category,
    score: Math.round(s.avgScore)
  }));

  // -------------------------------------------------------------------------
  // PROJECTED SCORE: data-driven forecast bounded by completion momentum and
  // remaining study time, penalized by the number of weak areas.
  // -------------------------------------------------------------------------
  const daysUntilExam = Math.max(
    0,
    Math.ceil((new Date(plan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const dailyImprovement = 0.3 + completionRate * 0.4; // 0.3-0.7 pts/day
  let projectedImprovement = Math.min(35, daysUntilExam * dailyImprovement);
  const weakAreasPenalty = Math.min(10, weakAreas.length * 0.5);
  projectedImprovement = Math.max(0, projectedImprovement - weakAreasPenalty);
  const projectedScore = hasAnyData
    ? Math.min(100, Math.round(overallScore + projectedImprovement))
    : 0;

  // Per-component breakdown surfaced to callers (not persisted under the strict
  // ReadinessScore schema, but returned on the response object).
  const breakdown = {
    components: {
      quiz: { score: Math.round(quizScore), weight: COMPONENT_WEIGHTS.quiz },
      mastery: { score: Math.round(masteryScore), weight: COMPONENT_WEIGHTS.mastery },
      completion: { score: Math.round(completionScore), weight: COMPONENT_WEIGHTS.completion },
      trend: { score: Math.round(trendScore), weight: COMPONENT_WEIGHTS.trend }
    },
    completionRate: Math.round(completionRate * 100),
    completedTasks,
    totalTasks,
    topicsCovered: topicStats.filter(ts => planTopicIdSet.has(ts.topicId.toString())).length,
    totalPlanTopics,
    trend: trendDirection,
    topWeakTopics,
    hasData: hasAnyData
  };

  // Create or update readiness score (persist only schema-supported fields).
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

  // Attach the non-persisted breakdown onto the returned document so the route
  // can surface it (via .toObject()) without changing the persisted schema.
  // We return the Mongoose document itself to stay return-type-compatible with
  // existing callers (e.g. monitorAgent) that expect a ReadinessScore document.
  if (readinessScore) {
    (readinessScore as any).breakdown = breakdown;
  }
  return readinessScore;
}
