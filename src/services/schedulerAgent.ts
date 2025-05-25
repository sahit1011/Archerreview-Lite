import {
  User,
  Topic,
  StudyPlan,
  Task,
  DiagnosticResult
} from '../models/index'; // Changed to relative
import {
  daysUntilExam,
  generateDateRange
} from '../utils/date'; // Changed to relative
import mongoose from 'mongoose';
import {
  TaskType,
  Difficulty
} from '../types/index'; // Changed to relative, assuming index.js
import {
  generateDefaultPlan,
  generatePersonalizedPlan
} from './planGenerationService'; // Changed to relative
import {
  validateStudyPlan
} from '../utils/planValidation'; // Changed to relative

/**
 * SchedulerAgent - Responsible for generating initial study plans
 *
 * This service handles:
 * 1. Processing diagnostic results
 * 2. Implementing constraint-based scheduling
 * 3. Building topic sequencing based on prerequisites
 * 4. Balancing workload across available days
 * 5. Generating default and personalized study plans
 * 6. Implementing spaced repetition scheduling
 * 7. Validating generated plans
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

interface TopicNode {
  topic: any; // Topic document
  prerequisites: string[];
  visited: boolean;
  scheduled: boolean;
  priority: number;
}

/**
 * Generate a study plan for a user
 * @param userId User ID
 * @param planId Study plan ID
 * @returns Generated study plan with tasks
 */
export async function generateStudyPlan(userId: string, planId: string) {
  try {
    // Get user, study plan, and diagnostic result
    const user = await User.findById(userId);
    const studyPlan = await StudyPlan.findById(planId);
    const diagnosticResult = await DiagnosticResult.findOne({ user: userId }).sort({ createdAt: -1 });

    if (!user || !studyPlan) {
      throw new Error('User or study plan not found');
    }

    // Get all topics
    const topics = await Topic.find({}).sort({ importance: -1 });
    if (topics.length === 0) {
      throw new Error('No topics found in the database');
    }

    // Generate schedule based on whether the user has completed a diagnostic assessment
    let schedule;

    if (diagnosticResult && diagnosticResult.completed && !diagnosticResult.skipped) {
      // Generate personalized plan based on diagnostic results
      console.log('Generating personalized plan based on diagnostic results');
      schedule = await generatePersonalizedPlan(user, studyPlan, topics, diagnosticResult);

      // Update study plan to mark as personalized
      studyPlan.isPersonalized = true;
      await studyPlan.save();
    } else {
      // Generate default plan for users who skipped the assessment
      console.log('Generating default plan (diagnostic skipped or not completed)');
      schedule = await generateDefaultPlan(user, studyPlan, topics);
    }

    // Create tasks from the schedule
    const tasks = await createTasksFromSchedule(schedule, studyPlan._id);

    // Validate the generated plan
    const validation = validateStudyPlan(tasks, topics, schedule);

    // Log validation results
    if (!validation.isValid) {
      console.warn('Generated plan has validation issues:', validation.issues);
    } else {
      console.log('Plan validation successful');
    }

    return {
      studyPlan,
      tasks,
      validation
    };
  } catch (error) {
    console.error('Error generating study plan:', error);
    throw error;
  }
}

/**
 * Process diagnostic results to prioritize topics
 * @param topics Array of all topics
 * @param diagnosticResult Diagnostic result document
 * @returns Map of topic IDs to priority scores
 */
function processTopicPriorities(topics: any[], diagnosticResult: any) {
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
 * Build a dependency graph for topics based on prerequisites
 * @param topics Array of all topics
 * @param topicPriorities Map of topic priorities
 * @returns Map of topic IDs to TopicNode objects
 */
function buildTopicDependencyGraph(topics: any[], topicPriorities: Map<string, number>) {
  const topicGraph = new Map<string, TopicNode>();

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
 * Sort topics based on prerequisites and priority
 * @param topicGraph Map of topic IDs to TopicNode objects
 * @returns Array of sorted topics
 */
function sortTopicsByPrerequisitesAndPriority(topicGraph: Map<string, TopicNode>) {
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
function generateSchedule(sortedTopics: any[], user: any, studyPlan: any) {
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
function distributeTopics(sortedTopics: any[], schedule: ScheduleDay[]) {
  // Calculate total available study time
  const totalAvailableMinutes = schedule.reduce((sum, day) => sum + day.availableMinutes, 0);

  // Calculate total estimated duration for all topics
  const totalTopicDuration = sortedTopics.reduce((sum, topic) => sum + topic.estimatedDuration, 0);

  // If total topic duration exceeds available time, adjust durations proportionally
  let durationMultiplier = 1;
  if (totalTopicDuration > totalAvailableMinutes) {
    durationMultiplier = totalAvailableMinutes / totalTopicDuration;
  }

  // Create a queue of topics to schedule
  const topicQueue = [...sortedTopics];

  // Schedule review sessions first (20% of time)
  const reviewTime = Math.floor(totalAvailableMinutes * 0.2);
  scheduleReviewSessions(schedule, reviewTime, sortedTopics);

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
  balanceSchedule(schedule);
}

/**
 * Schedule review sessions across the schedule
 * @param schedule Array of schedule days
 * @param totalReviewTime Total time to allocate for reviews
 * @param topics Array of topics to use for review sessions
 */
function scheduleReviewSessions(schedule: ScheduleDay[], totalReviewTime: number, topics: any[]) {
  // Skip the first few days as there's nothing to review yet
  const reviewableSchedule = schedule.slice(3);

  // If no reviewable days or no topics, skip review sessions
  if (reviewableSchedule.length === 0 || !topics || topics.length === 0) return;

  // Calculate review time per session
  const reviewTimePerSession = Math.min(60, Math.floor(totalReviewTime / reviewableSchedule.length));

  // Schedule review sessions
  reviewableSchedule.forEach((day, index) => {
    // Only schedule if there's enough time
    if (day.availableMinutes >= reviewTimePerSession) {
      // Use a random topic for the review session
      const randomTopicIndex = Math.floor(Math.random() * topics.length);
      const randomTopic = topics[randomTopicIndex];

      // Make sure we have a valid topic
      if (randomTopic && randomTopic._id) {
        day.tasks.push({
          topic: randomTopic._id, // Use an actual topic ID
          duration: reviewTimePerSession,
          type: TaskType.REVIEW,
          difficulty: Difficulty.MEDIUM
        });

        day.availableMinutes -= reviewTimePerSession;
      }
    }
  });
}

/**
 * Balance the schedule to avoid overloaded days
 * @param schedule Array of schedule days
 */
function balanceSchedule(schedule: ScheduleDay[]) {
  // Calculate average tasks per day
  const totalTasks = schedule.reduce((sum, day) => sum + day.tasks.length, 0);
  const avgTasksPerDay = totalTasks / schedule.length;

  // Identify overloaded and underloaded days
  const overloadedDays = schedule.filter(day => day.tasks.length > avgTasksPerDay * 1.5);
  const underloadedDays = schedule.filter(day => day.tasks.length < avgTasksPerDay * 0.5 && day.availableMinutes > 30);

  // Move tasks from overloaded to underloaded days
  overloadedDays.forEach(overloadedDay => {
    while (overloadedDay.tasks.length > avgTasksPerDay * 1.2 && underloadedDays.length > 0) {
      // Get a task to move
      const taskToMove = overloadedDay.tasks.pop();
      if (!taskToMove) break;

      // Find an underloaded day with enough time
      const targetDayIndex = underloadedDays.findIndex(day => day.availableMinutes >= taskToMove.duration);

      if (targetDayIndex >= 0) {
        const targetDay = underloadedDays[targetDayIndex];
        targetDay.tasks.push(taskToMove);
        targetDay.availableMinutes -= taskToMove.duration;

        // Update overloaded day's available minutes
        overloadedDay.availableMinutes += taskToMove.duration;

        // Remove target day from underloaded list if it's no longer underloaded
        if (targetDay.tasks.length >= avgTasksPerDay * 0.8 || targetDay.availableMinutes < 30) {
          underloadedDays.splice(targetDayIndex, 1);
        }
      } else {
        // If no suitable underloaded day found, put the task back
        overloadedDay.tasks.push(taskToMove);
        break;
      }
    }
  });
}

/**
 * Determine the task type based on the topic
 * @param topic Topic document
 * @returns Task type
 */
function determineTaskType(topic: any): string {
  // Simple logic to vary task types
  const rand = Math.random();

  if (rand < 0.3) return TaskType.READING;
  if (rand < 0.6) return TaskType.VIDEO;
  if (rand < 0.9) return TaskType.QUIZ;
  return TaskType.PRACTICE;
}

/**
 * Create tasks from the schedule
 * @param schedule Array of schedule days
 * @param planId Study plan ID
 * @returns Array of created tasks
 */
async function createTasksFromSchedule(schedule: ScheduleDay[], planId: mongoose.Types.ObjectId) {
  const tasks: any[] = [];
  const createdTasks: any[] = [];

  // Get a default topic to use if a task is missing a topic
  const defaultTopic = await Topic.findOne();
  if (!defaultTopic) {
    throw new Error('No topics found in the database');
  }

  // Convert schedule to tasks
  schedule.forEach(day => {
    // Create a map to track time slots for this day
    const timeSlots: Map<number, boolean> = new Map();

    // Start at 9 AM by default
    let currentTime = new Date(day.date);
    currentTime.setHours(9, 0, 0, 0);

    // Sort tasks by duration (longest first) to optimize scheduling
    const sortedTasks = [...day.tasks].sort((a, b) => b.duration - a.duration);

    sortedTasks.forEach(taskData => {
      // Skip tasks without a topic
      if (!taskData.topic) {
        console.warn('Skipping task without a topic');
        return;
      }

      // Calculate task duration in minutes
      const durationMinutes = taskData.duration;

      // Find the next available time slot
      let startTime = new Date(currentTime);
      let endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);

      // Check if this time slot is already taken
      let slotAvailable = true;
      for (let min = 0; min < durationMinutes; min++) {
        const timeKey = startTime.getHours() * 60 + startTime.getMinutes() + min;
        if (timeSlots.has(timeKey)) {
          slotAvailable = false;
          break;
        }
      }

      // If slot is not available, find the next available slot
      if (!slotAvailable) {
        // Find the next available time slot by checking each 15-minute increment
        let foundSlot = false;
        let attemptTime = new Date(currentTime);
        attemptTime.setMinutes(attemptTime.getMinutes() + 15); // Start 15 minutes later

        // Try up to 24 hours worth of 15-minute increments (96 attempts)
        for (let attempt = 0; attempt < 96 && !foundSlot; attempt++) {
          // Check if this time slot works
          foundSlot = true;

          // Check each minute of the potential task duration
          for (let min = 0; min < durationMinutes; min++) {
            const timeKey = attemptTime.getHours() * 60 + attemptTime.getMinutes() + min;
            if (timeSlots.has(timeKey)) {
              foundSlot = false;
              break;
            }
          }

          if (foundSlot) {
            // We found an available slot
            startTime = new Date(attemptTime);
            endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + durationMinutes);
          } else {
            // Try the next 15-minute increment
            attemptTime.setMinutes(attemptTime.getMinutes() + 15);
          }
        }

        // If we couldn't find a slot after all attempts, use the end of the day
        if (!foundSlot) {
          console.warn('Could not find available time slot, scheduling at end of day');
          startTime = new Date(day.date);
          startTime.setHours(17, 0, 0, 0); // Default to 5 PM if no slots available
          endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + durationMinutes);
        }
      }

      // Mark all minutes in this time slot as taken
      for (let min = 0; min < durationMinutes; min++) {
        const timeKey = startTime.getHours() * 60 + startTime.getMinutes() + min;
        timeSlots.set(timeKey, true);
      }

      // Add a 5-minute buffer between tasks
      currentTime = new Date(endTime);
      currentTime.setMinutes(currentTime.getMinutes() + 5);

      tasks.push({
        plan: planId,
        title: `${taskData.type} Session`,
        description: `${taskData.type} session for topic`,
        type: taskData.type,
        status: 'PENDING',
        startTime,
        endTime,
        duration: taskData.duration,
        topic: taskData.topic || defaultTopic._id, // Use default topic if missing
        difficulty: taskData.difficulty || 'MEDIUM'
      });
    });
  });

  // Create tasks in database
  for (const taskData of tasks) {
    try {
      const task = new Task(taskData);
      const savedTask = await task.save();
      createdTasks.push(savedTask);
    } catch (error) {
      console.error('Error saving task:', error);
      throw error; // Throw the error to stop the process
    }
  }

  return createdTasks;
}
