import {
  User,
  Topic,
  StudyPlan,
  DiagnosticResult
} from '../models/index'; // Changed to relative
import {
  daysUntilExam,
  generateDateRange
} from '../utils/date'; // Changed to relative
import {
  distributeReviewSessions
} from '../utils/spacedRepetition'; // Changed to relative
import {
  validateStudyPlan
} from '../utils/planValidation'; // Changed to relative
import mongoose from 'mongoose';
import {
  TaskType,
  Difficulty
} from '../types/index'; // Changed to relative, assuming index.js

/**
 * PlanGenerationService - Responsible for generating study plans
 *
 * This service handles:
 * 1. Default plan generation for students who skip assessment
 * 2. Personalized plan generation based on diagnostic results
 * 3. Topic distribution based on exam date
 * 4. Difficulty progression
 * 5. Spaced repetition scheduling
 * 6. Workload distribution based on availability
 */

interface ScheduleDay {
  date: Date;
  availableMinutes: number;
  tasks: {
    topic: mongoose.Types.ObjectId;
    duration: number;
    type: string;
    difficulty: string;
  }[];
}

/**
 * Generate a default study plan for students who skip assessment
 * @param user User document
 * @param studyPlan Study plan document
 * @param topics Array of topics
 * @returns Generated schedule
 */
export async function generateDefaultPlan(
  user: any,
  studyPlan: any,
  topics: any[]
): Promise<ScheduleDay[]> {
  // Sort topics by importance (highest first)
  const sortedTopics = [...topics].sort((a, b) => b.importance - a.importance);

  // Create a dependency graph for topics
  const topicGraph = buildTopicDependencyGraph(sortedTopics);

  // Sort topics based on prerequisites and importance
  const orderedTopics = sortTopicsByPrerequisitesAndImportance(topicGraph);

  // Generate schedule based on user preferences and sorted topics
  const schedule = generateSchedule(orderedTopics, user, studyPlan);

  // Implement progressive difficulty
  const progressiveSchedule = implementProgressiveDifficulty(schedule);

  // Add spaced repetition
  const finalSchedule = distributeReviewSessions(
    progressiveSchedule,
    orderedTopics,
    studyPlan.examDate
  );

  return finalSchedule;
}

/**
 * Generate a personalized study plan based on diagnostic results
 * @param user User document
 * @param studyPlan Study plan document
 * @param topics Array of topics
 * @param diagnosticResult Diagnostic result document
 * @returns Generated schedule
 */
export async function generatePersonalizedPlan(
  user: any,
  studyPlan: any,
  topics: any[],
  diagnosticResult: any
): Promise<ScheduleDay[]> {
  // Process diagnostic results to prioritize topics
  const topicPriorities = processTopicPriorities(topics, diagnosticResult);

  // Create a dependency graph for topics with priorities
  const topicGraph = buildTopicDependencyGraphWithPriorities(topics, topicPriorities);

  // Sort topics based on prerequisites and priorities
  const orderedTopics = sortTopicsByPrerequisitesAndPriority(topicGraph);

  // Generate schedule based on user preferences and sorted topics
  const schedule = generateSchedule(orderedTopics, user, studyPlan);

  // Implement personalized difficulty progression
  const progressiveSchedule = implementPersonalizedDifficulty(
    schedule,
    diagnosticResult
  );

  // Add spaced repetition with personalized intervals
  const finalSchedule = distributePersonalizedReviewSessions(
    progressiveSchedule,
    orderedTopics,
    studyPlan.examDate,
    diagnosticResult
  );

  return finalSchedule;
}

/**
 * Process diagnostic results to prioritize topics
 * @param topics Array of all topics
 * @param diagnosticResult Diagnostic result document
 * @returns Map of topic IDs to priority scores
 */
function processTopicPriorities(topics: any[], diagnosticResult: any): Map<string, number> {
  const topicPriorities = new Map<string, number>();

  // Set default priorities based on topic importance
  topics.forEach(topic => {
    topicPriorities.set(topic._id.toString(), topic.importance);
  });

  // If diagnostic was skipped or not completed, return default priorities
  if (!diagnosticResult || diagnosticResult.skipped || !diagnosticResult.completed) {
    return topicPriorities;
  }

  // Process diagnostic results to adjust priorities
  if (diagnosticResult.weakAreas && diagnosticResult.weakAreas.length > 0) {
    // Increase priority for weak areas
    topics.forEach(topic => {
      if (diagnosticResult.weakAreas.includes(topic.category)) {
        const currentPriority = topicPriorities.get(topic._id.toString()) || 0;
        topicPriorities.set(topic._id.toString(), currentPriority + 3);
      }
    });
  }

  // Process specific question answers
  if (diagnosticResult.answers && diagnosticResult.answers.length > 0) {
    diagnosticResult.answers.forEach((answer: any) => {
      if (!answer.isCorrect && answer.topic) {
        const topicId = answer.topic.toString();
        const currentPriority = topicPriorities.get(topicId) || 0;
        topicPriorities.set(topicId, currentPriority + 2);
      }
    });
  }

  // If recommended focus topics are provided, boost their priority
  if (diagnosticResult.recommendedFocus && diagnosticResult.recommendedFocus.length > 0) {
    diagnosticResult.recommendedFocus.forEach((topicId: any) => {
      const id = topicId.toString();
      const currentPriority = topicPriorities.get(id) || 0;
      topicPriorities.set(id, currentPriority + 4);
    });
  }

  return topicPriorities;
}

/**
 * Build a dependency graph for topics
 * @param topics Array of topics
 * @returns Map of topic IDs to topic nodes
 */
function buildTopicDependencyGraph(topics: any[]): Map<string, any> {
  const topicGraph = new Map<string, any>();

  // Initialize graph
  topics.forEach(topic => {
    topicGraph.set(topic._id.toString(), {
      topic,
      prerequisites: topic.prerequisites.map((p: any) => p.toString()),
      visited: false,
      scheduled: false,
      priority: topic.importance
    });
  });

  return topicGraph;
}

/**
 * Build a dependency graph for topics with priorities
 * @param topics Array of topics
 * @param topicPriorities Map of topic IDs to priority scores
 * @returns Map of topic IDs to topic nodes
 */
function buildTopicDependencyGraphWithPriorities(
  topics: any[],
  topicPriorities: Map<string, number>
): Map<string, any> {
  const topicGraph = new Map<string, any>();

  // Initialize graph
  topics.forEach(topic => {
    topicGraph.set(topic._id.toString(), {
      topic,
      prerequisites: topic.prerequisites.map((p: any) => p.toString()),
      visited: false,
      scheduled: false,
      priority: topicPriorities.get(topic._id.toString()) || topic.importance
    });
  });

  return topicGraph;
}

/**
 * Sort topics based on prerequisites and importance
 * @param topicGraph Map of topic IDs to topic nodes
 * @returns Array of sorted topics
 */
function sortTopicsByPrerequisitesAndImportance(topicGraph: Map<string, any>): any[] {
  const sortedTopics: any[] = [];
  const visited = new Set<string>();

  // Helper function for topological sort
  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;

    const node = topicGraph.get(nodeId);
    if (!node) return;

    visited.add(nodeId);

    // Visit prerequisites first
    for (const prereqId of node.prerequisites) {
      if (!visited.has(prereqId)) {
        visit(prereqId);
      }
    }

    sortedTopics.push(node.topic);
  }

  // Get nodes sorted by importance (highest first)
  const nodesByImportance = Array.from(topicGraph.entries())
    .sort((a, b) => b[1].topic.importance - a[1].topic.importance);

  // Visit nodes in importance order
  for (const [nodeId] of nodesByImportance) {
    if (!visited.has(nodeId)) {
      visit(nodeId);
    }
  }

  return sortedTopics;
}

/**
 * Sort topics based on prerequisites and priority
 * @param topicGraph Map of topic IDs to topic nodes
 * @returns Array of sorted topics
 */
function sortTopicsByPrerequisitesAndPriority(topicGraph: Map<string, any>): any[] {
  const sortedTopics: any[] = [];
  const visited = new Set<string>();

  // Helper function for topological sort
  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;

    const node = topicGraph.get(nodeId);
    if (!node) return;

    visited.add(nodeId);

    // Visit prerequisites first
    for (const prereqId of node.prerequisites) {
      if (!visited.has(prereqId)) {
        visit(prereqId);
      }
    }

    sortedTopics.push(node.topic);
  }

  // Get nodes sorted by priority (highest first)
  const nodesByPriority = Array.from(topicGraph.entries())
    .sort((a, b) => b[1].priority - a[1].priority);

  // Visit nodes in priority order
  for (const [nodeId] of nodesByPriority) {
    if (!visited.has(nodeId)) {
      visit(nodeId);
    }
  }

  return sortedTopics;
}

/**
 * Generate a schedule based on user preferences and sorted topics
 * @param sortedTopics Array of sorted topics
 * @param user User document
 * @param studyPlan Study plan document
 * @returns Array of schedule days
 */
function generateSchedule(sortedTopics: any[], user: any, studyPlan: any): ScheduleDay[] {
  // Calculate date range from start date to exam date
  const startDate = studyPlan.startDate;
  const examDate = studyPlan.examDate;
  const days = daysUntilExam(examDate) + 1;
  const dateRange = generateDateRange(startDate, days);

  // Filter dates based on user's available days
  const availableDays = user.preferences.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const availableDates = dateRange.filter(date => {
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
    return availableDays.includes(dayName);
  });

  if (availableDates.length === 0) {
    throw new Error('No available study days found based on user preferences');
  }

  // Initialize schedule
  const schedule: ScheduleDay[] = availableDates.map(date => ({
    date,
    availableMinutes: user.preferences.studyHoursPerDay * 60,
    tasks: []
  }));

  // Distribute topics across available days
  distributeTopics(sortedTopics, schedule);

  return schedule;
}

/**
 * Distribute topics across available days in the schedule
 * @param sortedTopics Array of sorted topics
 * @param schedule Array of schedule days
 */
function distributeTopics(sortedTopics: any[], schedule: ScheduleDay[]): void {
  // Calculate total available study time
  const totalAvailableMinutes = schedule.reduce((sum, day) => sum + day.availableMinutes, 0);

  // Calculate total estimated duration for all topics
  const totalTopicDuration = sortedTopics.reduce((sum, topic) => sum + topic.estimatedDuration, 0);

  // If total topic duration exceeds available time, adjust durations proportionally
  let durationMultiplier = 1;
  // Check if totalTopicDuration is greater than zero before dividing
  if (totalTopicDuration > 0 && totalTopicDuration > totalAvailableMinutes * 0.8) { // Reserve 20% for reviews
    durationMultiplier = (totalAvailableMinutes * 0.8) / totalTopicDuration;
  } else if (totalTopicDuration === 0) {
    // Handle case where total duration is zero (e.g., no topics or all durations are 0)
    // Avoid division by zero. Maybe log a warning or assign a default duration later.
    console.warn("Total estimated duration for topics is zero. Cannot calculate duration multiplier accurately.");
    // durationMultiplier remains 1, tasks will use default Math.max(30, ...) later
  }

  // Create a queue of topics to schedule
  const topicQueue = [...sortedTopics];

  // Schedule topics
  let currentDayIndex = 0;

  while (topicQueue.length > 0) {
    const topic = topicQueue.shift();
    if (!topic) break;

    // Adjust duration based on multiplier
    const adjustedDuration = Math.max(30, Math.floor(topic.estimatedDuration * durationMultiplier));

    // Find a day with enough available time
    let scheduled = false;
    let attemptsCount = 0;

    while (!scheduled && attemptsCount < schedule.length) {
      const day = schedule[currentDayIndex];

      if (day.availableMinutes >= adjustedDuration) {
        // Schedule the topic on this day
        day.tasks.push({
          topic: topic._id,
          duration: adjustedDuration,
          type: determineTaskType(topic),
          difficulty: topic.difficulty
        });

        // Update available minutes
        day.availableMinutes -= adjustedDuration;
        scheduled = true;
      }

      // Move to next day
      currentDayIndex = (currentDayIndex + 1) % schedule.length;
      attemptsCount++;
    }

    // If we couldn't schedule the topic, split it into smaller chunks
    if (!scheduled && adjustedDuration > 30) {
      const chunks = Math.ceil(adjustedDuration / 30);
      const chunkDuration = Math.floor(adjustedDuration / chunks);

      for (let i = 0; i < chunks; i++) {
        topicQueue.push({
          ...topic,
          estimatedDuration: chunkDuration
        });
      }
    }
  }

  // Balance the schedule to avoid overloaded days
  balanceSchedule(schedule, 5); // Limit to 5 iterations
}

/**
 * Determine the task type based on topic
 * @param topic Topic document
 * @returns Task type
 */
function determineTaskType(topic: any): string {
  // For now, randomly assign a task type
  // In a real implementation, this would be based on topic content and learning objectives
  const taskTypes = [
    TaskType.VIDEO,
    TaskType.QUIZ,
    TaskType.READING,
    TaskType.PRACTICE
  ];

  return taskTypes[Math.floor(Math.random() * taskTypes.length)];
}

/**
 * Balance the schedule to avoid overloaded days
 * @param schedule Array of schedule days
 * @param maxIterations Maximum number of balancing iterations to prevent infinite recursion
 */
function balanceSchedule(schedule: ScheduleDay[], maxIterations: number = 5): void {
  // Base case: stop recursion if max iterations reached
  if (maxIterations <= 0) {
    console.log('Max balancing iterations reached, stopping recursion');
    return;
  }

  // Sort days by workload (most overloaded first)
  const sortedDays = [...schedule].sort((a, b) => {
    const aWorkload = a.tasks.reduce((sum, task) => sum + task.duration, 0);
    const bWorkload = b.tasks.reduce((sum, task) => sum + task.duration, 0);
    return bWorkload - aWorkload;
  });

  // Get the most and least loaded days
  const mostLoadedDay = sortedDays[0];
  const leastLoadedDay = sortedDays[sortedDays.length - 1];

  // If no days found, exit early
  if (!mostLoadedDay || !leastLoadedDay) {
    return;
  }

  // If the difference is significant, move a task
  const mostLoadedMinutes = mostLoadedDay.tasks.reduce((sum, task) => sum + task.duration, 0);
  const leastLoadedMinutes = leastLoadedDay.tasks.reduce((sum, task) => sum + task.duration, 0);

  if (mostLoadedMinutes - leastLoadedMinutes > 60) {
    // Find a task to move
    const movableTasks = mostLoadedDay.tasks.filter(task => task.type !== TaskType.REVIEW);

    if (movableTasks.length === 0) {
      return; // No movable tasks, exit
    }

    const taskToMove = movableTasks.sort((a, b) => b.duration - a.duration)[0]; // Move the longest task

    if (taskToMove && leastLoadedDay.availableMinutes >= taskToMove.duration) {
      // Remove task from most loaded day
      mostLoadedDay.tasks = mostLoadedDay.tasks.filter(task => task !== taskToMove);
      mostLoadedDay.availableMinutes += taskToMove.duration;

      // Add task to least loaded day
      leastLoadedDay.tasks.push(taskToMove);
      leastLoadedDay.availableMinutes -= taskToMove.duration;

      // Recursively balance with decremented iteration count
      balanceSchedule(schedule, maxIterations - 1);
    }
  }
}

/**
 * Implement progressive difficulty in the schedule
 * @param schedule Array of schedule days
 * @returns Updated schedule with progressive difficulty
 */
function implementProgressiveDifficulty(schedule: ScheduleDay[]): ScheduleDay[] {
  // Create a copy of the schedule to avoid modifying the original
  const updatedSchedule = [...schedule];

  // Calculate the total number of days
  const totalDays = updatedSchedule.length;

  // Define difficulty distribution
  // First third: mostly easy, some medium
  // Middle third: mostly medium, some easy and hard
  // Last third: mostly hard, some medium

  // Group days into thirds
  const firstThird = updatedSchedule.slice(0, Math.floor(totalDays / 3));
  const middleThird = updatedSchedule.slice(Math.floor(totalDays / 3), Math.floor(2 * totalDays / 3));
  const lastThird = updatedSchedule.slice(Math.floor(2 * totalDays / 3));

  // Adjust difficulty for each third
  adjustDifficultyForDays(firstThird, 0.7, 0.3, 0);
  adjustDifficultyForDays(middleThird, 0.2, 0.6, 0.2);
  adjustDifficultyForDays(lastThird, 0, 0.3, 0.7);

  return updatedSchedule;
}

/**
 * Adjust difficulty for a group of days
 * @param days Array of schedule days
 * @param easyRatio Ratio of easy tasks
 * @param mediumRatio Ratio of medium tasks
 * @param hardRatio Ratio of hard tasks
 */
function adjustDifficultyForDays(
  days: ScheduleDay[],
  easyRatio: number,
  mediumRatio: number,
  hardRatio: number
): void {
  // Get all tasks from these days
  const allTasks: any[] = [];
  days.forEach(day => {
    day.tasks.forEach(task => {
      if (task.type !== TaskType.REVIEW) { // Don't adjust review tasks
        allTasks.push(task);
      }
    });
  });

  // Calculate target counts
  const totalTasks = allTasks.length;
  const targetEasy = Math.round(totalTasks * easyRatio);
  const targetMedium = Math.round(totalTasks * mediumRatio);
  const targetHard = Math.round(totalTasks * hardRatio);

  // Sort tasks by original difficulty (easy first, hard last)
  allTasks.sort((a, b) => {
    const difficultyMap: Record<string, number> = {
      'EASY': 0,
      'MEDIUM': 1,
      'HARD': 2
    };
    return difficultyMap[a.difficulty] - difficultyMap[b.difficulty];
  });

  // Assign new difficulties
  for (let i = 0; i < allTasks.length; i++) {
    if (i < targetEasy) {
      allTasks[i].difficulty = Difficulty.EASY;
    } else if (i < targetEasy + targetMedium) {
      allTasks[i].difficulty = Difficulty.MEDIUM;
    } else {
      allTasks[i].difficulty = Difficulty.HARD;
    }
  }
}

/**
 * Implement personalized difficulty progression based on diagnostic results
 * @param schedule Array of schedule days
 * @param diagnosticResult Diagnostic result document
 * @returns Updated schedule with personalized difficulty
 */
function implementPersonalizedDifficulty(
  schedule: ScheduleDay[],
  diagnosticResult: any
): ScheduleDay[] {
  // Create a copy of the schedule to avoid modifying the original
  const updatedSchedule = [...schedule];

  // If diagnostic was skipped or not completed, use default progression
  if (!diagnosticResult || diagnosticResult.skipped || !diagnosticResult.completed) {
    return implementProgressiveDifficulty(updatedSchedule);
  }

  // Calculate the total number of days
  const totalDays = updatedSchedule.length;

  // Calculate overall performance from diagnostic
  const overallScore = diagnosticResult.score || 0;

  // Adjust difficulty ratios based on performance
  let easyRatio, mediumRatio, hardRatio;

  if (overallScore >= 80) {
    // High performer: more hard content
    easyRatio = 0.1;
    mediumRatio = 0.3;
    hardRatio = 0.6;
  } else if (overallScore >= 60) {
    // Medium performer: balanced content
    easyRatio = 0.2;
    mediumRatio = 0.5;
    hardRatio = 0.3;
  } else {
    // Low performer: more easy content
    easyRatio = 0.5;
    mediumRatio = 0.4;
    hardRatio = 0.1;
  }

  // Group days into thirds
  const firstThird = updatedSchedule.slice(0, Math.floor(totalDays / 3));
  const middleThird = updatedSchedule.slice(Math.floor(totalDays / 3), Math.floor(2 * totalDays / 3));
  const lastThird = updatedSchedule.slice(Math.floor(2 * totalDays / 3));

  // Adjust difficulty for each third, gradually increasing difficulty
  adjustDifficultyForDays(
    firstThird,
    easyRatio + 0.2,
    mediumRatio,
    Math.max(0, hardRatio - 0.2)
  );

  adjustDifficultyForDays(
    middleThird,
    easyRatio,
    mediumRatio,
    hardRatio
  );

  adjustDifficultyForDays(
    lastThird,
    Math.max(0, easyRatio - 0.2),
    mediumRatio,
    hardRatio + 0.2
  );

  return updatedSchedule;
}

/**
 * Distribute personalized review sessions across a schedule
 * @param schedule Array of schedule days
 * @param topics Array of topics
 * @param examDate The exam date
 * @param diagnosticResult Diagnostic result document
 * @returns Updated schedule with personalized review sessions
 */
function distributePersonalizedReviewSessions(
  schedule: ScheduleDay[],
  topics: any[],
  examDate: Date,
  diagnosticResult: any
): ScheduleDay[] {
  // If diagnostic was skipped or not completed, use default review distribution
  if (!diagnosticResult || diagnosticResult.skipped || !diagnosticResult.completed) {
    return distributeReviewSessions(schedule, topics, examDate);
  }

  // Create a copy of the schedule to avoid modifying the original
  const updatedSchedule = [...schedule];

  // Get weak areas from diagnostic result
  const weakAreas = diagnosticResult.weakAreas || [];

  // Get topics in weak areas
  const weakAreaTopics = topics.filter(topic =>
    weakAreas.includes(topic.category)
  );

  // Process each topic to add review sessions
  topics.forEach(topic => {
    // Find the initial study day for this topic
    const initialStudyDayIndex = updatedSchedule.findIndex(day =>
      day.tasks.some((task: any) =>
        task.topic.toString() === topic._id.toString() &&
        task.type !== 'REVIEW'
      )
    );

    // Skip if topic is not scheduled
    if (initialStudyDayIndex === -1) return;

    // Get the initial study date
    const initialStudyDate = updatedSchedule[initialStudyDayIndex].date;

    // Determine number of review sessions based on topic priority
    let maxReviews = 2; // Default

    // Add more reviews for weak area topics
    if (weakAreaTopics.some(weakTopic => weakTopic._id.toString() === topic._id.toString())) {
      maxReviews = 4; // More reviews for weak areas
    }

    // Generate review dates
    const reviewDates = generatePersonalizedReviewDates(
      initialStudyDate,
      examDate,
      topic.difficulty,
      maxReviews,
      diagnosticResult
    );

    // Schedule review sessions
    reviewDates.forEach(reviewDate => {
      // Find the closest day to the review date
      const closestDayIndex = findClosestDayIndex(updatedSchedule, reviewDate);

      // Skip if no suitable day found
      if (closestDayIndex === -1) return;

      const day = updatedSchedule[closestDayIndex];

      // Only add review if there's enough time available
      const reviewDuration = 20; // 20 minutes for review
      if (day.availableMinutes >= reviewDuration) {
        // Add review task
        day.tasks.push({
          topic: topic._id,
          duration: reviewDuration,
          type: 'REVIEW',
          difficulty: topic.difficulty
        });

        // Update available minutes
        day.availableMinutes -= reviewDuration;
      }
    });
  });

  return updatedSchedule;
}

/**
 * Generate personalized review dates based on diagnostic results
 * @param initialDate The initial study date
 * @param examDate The exam date
 * @param difficulty The difficulty level of the topic
 * @param maxReviews Maximum number of review sessions to schedule
 * @param diagnosticResult Diagnostic result document
 * @returns Array of review dates
 */
function generatePersonalizedReviewDates(
  initialDate: Date,
  examDate: Date,
  difficulty: string,
  maxReviews: number = 3,
  diagnosticResult: any
): Date[] {
  const reviewDates: Date[] = [];
  let currentDate = new Date(initialDate);

  // Calculate days until exam
  const daysUntilExam = Math.ceil(
    (examDate.getTime() - initialDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Adjust max reviews based on days until exam
  const adjustedMaxReviews = Math.min(
    maxReviews,
    Math.floor(daysUntilExam / 2) // Ensure at least 2 days between reviews
  );

  // Calculate performance factor (0.7-1.3)
  let performanceFactor = 1.0;
  if (diagnosticResult && !diagnosticResult.skipped && diagnosticResult.completed) {
    const score = diagnosticResult.score || 0;
    performanceFactor = 1.3 - (score / 100) * 0.6; // Lower score = higher factor (more frequent reviews)
  }

  // Generate review dates
  for (let i = 0; i < adjustedMaxReviews; i++) {
    // Calculate interval for this review
    // First review uses base interval, subsequent reviews increase interval
    const intervalMultiplier = i === 0 ? 1 : i * 1.5;

    // Base intervals by difficulty (in days)
    const baseIntervals: Record<string, number> = {
      'EASY': 7,
      'MEDIUM': 5,
      'HARD': 3
    };

    // Get base interval based on difficulty
    const baseInterval = baseIntervals[difficulty] || baseIntervals['MEDIUM'];

    // Calculate final interval with performance factor
    const interval = Math.round(baseInterval * intervalMultiplier * performanceFactor);

    // Add interval to current date
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + interval);

    // Ensure review date is before exam date
    if (currentDate < examDate) {
      reviewDates.push(new Date(currentDate));
    } else {
      break;
    }
  }

  return reviewDates;
}

/**
 * Find the index of the closest day to a target date
 * @param schedule Array of schedule days
 * @param targetDate The target date
 * @param maxDaysDifference Maximum allowed difference in days
 * @returns Index of the closest day or -1 if not found
 */
function findClosestDayIndex(
  schedule: ScheduleDay[],
  targetDate: Date,
  maxDaysDifference: number = 2
): number {
  let closestIndex = -1;
  let minDifference = Number.MAX_SAFE_INTEGER;

  schedule.forEach((day, index) => {
    const difference = Math.abs(
      (day.date.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only consider days within the maximum allowed difference
    if (difference <= maxDaysDifference && difference < minDifference) {
      minDifference = difference;
      closestIndex = index;
    }
  });

  return closestIndex;
}
