import mongoose from 'mongoose';
import dbConnect from '../lib/db'; // Changed to relative
import {
  User,
  Task,
  Performance,
  StudyPlan,
  Alert,
  Topic,
  Content
} from '../models/index'; // Changed to relative
import { generateRemediationSuggestions as generateServiceSuggestions, RemediationType } from './remediationService'; // Added .js
import { findOptimalReviewTime } from './schedulerUtils'; // Added .js
import { generateTopicTutorResponse } from './generativeAI'; // Added .js

/**
 * RemediationAgent - Responsible for coordinating remediation activities
 *
 * This service handles:
 * 1. Continuous monitoring for remediation opportunities
 * 2. Coordination with Scheduler Agent for review sessions
 * 3. Integration with AI Tutor for immediate assistance
 * 4. Tracking remediation effectiveness
 * 5. Adaptive remediation strategy selection
 */

// Types of remediation actions
export enum RemediationActionType {
  GENERATE_SUGGESTION = 'GENERATE_SUGGESTION',
  SCHEDULE_REVIEW = 'SCHEDULE_REVIEW',
  START_TUTOR_SESSION = 'START_TUTOR_SESSION',
  RECOMMEND_CONTENT = 'RECOMMEND_CONTENT',
  ADJUST_DIFFICULTY = 'ADJUST_DIFFICULTY'
}

// Interface for remediation action
export interface RemediationAction {
  type: RemediationActionType;
  description: string;
  topicId?: string;
  taskId?: string;
  alertId?: string;
  metadata?: Record<string, any>;
}

// Interface for remediation result
export interface RemediationAgentResult {
  userId: string;
  planId: string;
  actions: RemediationAction[];
  suggestions: any[];
  scheduledReviews: any[];
  tutorSessions: any[];
  summary: {
    totalActions: number;
    byType: Record<RemediationActionType, number>;
    byTopic: Record<string, number>;
  };
}

/**
 * Run the Remediation Agent for a user
 * @param userId User ID to run the agent for
 * @returns Remediation agent result
 */
export async function runRemediationAgent(userId: string): Promise<RemediationAgentResult> {
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

    // Initialize result
    const result: RemediationAgentResult = {
      userId,
      planId: studyPlan._id.toString(),
      actions: [],
      suggestions: [],
      scheduledReviews: [],
      tutorSessions: [],
      summary: {
        totalActions: 0,
        byType: {
          [RemediationActionType.GENERATE_SUGGESTION]: 0,
          [RemediationActionType.SCHEDULE_REVIEW]: 0,
          [RemediationActionType.START_TUTOR_SESSION]: 0,
          [RemediationActionType.RECOMMEND_CONTENT]: 0,
          [RemediationActionType.ADJUST_DIFFICULTY]: 0
        },
        byTopic: {}
      }
    };

    // Get existing remediation suggestions
    const existingSuggestions = await Alert.find({
      user: userId,
      type: 'REMEDIATION',
      isResolved: false
    }).populate('relatedTopic');

    result.suggestions = existingSuggestions;

    // Get scheduled review sessions
    const scheduledReviews = await Task.find({
      plan: studyPlan._id,
      type: 'REVIEW',
      status: 'PENDING',
      'metadata.isRemediation': true,
      startTime: { $gte: new Date() }
    }).populate('topic');

    result.scheduledReviews = scheduledReviews;

    // Get recent tutor sessions
    const tutorSessions = await Performance.find({
      user: userId,
      type: 'TUTOR_SESSION'
    }).sort({ createdAt: -1 }).limit(5).populate('topic');

    result.tutorSessions = tutorSessions;

    // Run remediation processes
    await Promise.all([
      generateAgentSuggestions(userId, result),
      scheduleReviewSessions(userId, studyPlan._id, existingSuggestions, scheduledReviews, result),
      prepareAITutorSessions(userId, existingSuggestions, result)
    ]);

    // Update summary
    result.summary.totalActions = result.actions.length;

    return result;
  } catch (error) {
    console.error('Error running remediation agent:', error);
    throw error;
  }
}

/**
 * Generate remediation suggestions if needed
 */
async function generateAgentSuggestions(
  userId: string,
  result: RemediationAgentResult
): Promise<void> {
  // Skip if there are already active suggestions
  if (result.suggestions.length >= 3) {
    console.log(`User ${userId} already has ${result.suggestions.length} active suggestions. Skipping generation.`);
    return;
  }

  try {
    // Generate new remediation suggestions
    const remediationResult = await generateServiceSuggestions(userId);

    // Add action for each new suggestion
    if (remediationResult && remediationResult.remediations) {
      for (const remediation of remediationResult.remediations) {
        result.actions.push({
          type: RemediationActionType.GENERATE_SUGGESTION,
          description: `Generated remediation suggestion: ${remediation.title}`,
          topicId: remediation.topicId,
          metadata: {
            remediationType: remediation.type,
            title: remediation.title,
            urgency: remediation.urgency
          }
        });

        // Update summary
        result.summary.byType[RemediationActionType.GENERATE_SUGGESTION]++;
        if (remediation.topicId) {
          result.summary.byTopic[remediation.topicId] = (result.summary.byTopic[remediation.topicId] || 0) + 1;
        }
      }
    }
  } catch (error) {
    console.error('Error generating remediation suggestions:', error);
  }
}

/**
 * Schedule review sessions for topics that need remediation
 */
async function scheduleReviewSessions(
  userId: string,
  planId: mongoose.Types.ObjectId,
  suggestions: any[],
  scheduledReviews: any[],
  result: RemediationAgentResult
): Promise<void> {
  // Get remediation suggestions that need review sessions
  const reviewSuggestions = suggestions.filter(suggestion =>
    suggestion.metadata.remediationType === 'CONCEPT_REVIEW' &&
    suggestion.relatedTopic
  );

  // Skip if no review suggestions
  if (reviewSuggestions.length === 0) {
    return;
  }

  // Check if there are already scheduled reviews for these topics
  const topicsWithScheduledReviews = new Set(
    scheduledReviews.map(review => review.topic._id.toString())
  );

  // Also check for existing scheduled reviews in the database
  const now = new Date();
  const additionalScheduledReviews = await Task.find({
    plan: planId,
    type: 'REVIEW',
    status: 'PENDING',
    startTime: { $gte: now },
    'metadata.isRemediation': true
  }).populate('topic');

  // Add these to our set of topics with scheduled reviews
  for (const review of additionalScheduledReviews) {
    if (review.topic && review.topic._id) {
      topicsWithScheduledReviews.add(review.topic._id.toString());
    }
  }

  // Schedule reviews for topics that don't already have one
  for (const suggestion of reviewSuggestions) {
    const topicId = suggestion.relatedTopic._id.toString();

    // Skip if already scheduled
    if (topicsWithScheduledReviews.has(topicId)) {
      // Update the suggestion to reference the scheduled task if it exists
      const existingReview = [...scheduledReviews, ...additionalScheduledReviews].find(
        review => review.topic._id.toString() === topicId
      );

      if (existingReview && !suggestion.metadata.scheduledTaskId) {
        await Alert.findByIdAndUpdate(suggestion._id, {
          $set: {
            'metadata.scheduledTaskId': existingReview._id.toString(),
            'metadata.suggestedAction': `Complete the scheduled review session on ${existingReview.startTime.toLocaleDateString()} at ${existingReview.startTime.toLocaleTimeString()}`
          }
        });
      }

      continue;
    }

    try {
      // Find optimal time for review
      const scheduledTime = await findOptimalReviewTime(userId, planId.toString());

      // Create review task
      const task = new Task({
        plan: planId,
        title: `Review: ${suggestion.relatedTopic.name}`,
        description: `Review session for ${suggestion.relatedTopic.name} scheduled by the Remediation Agent.`,
        type: 'REVIEW',
        status: 'PENDING',
        startTime: scheduledTime.startTime,
        endTime: scheduledTime.endTime,
        duration: scheduledTime.duration,
        topic: suggestion.relatedTopic._id,
        difficulty: suggestion.relatedTopic.difficulty || 'MEDIUM',
        metadata: {
          source: 'REMEDIATION_AGENT',
          priority: 'HIGH',
          isRemediation: true,
          relatedAlertId: suggestion._id.toString()
        }
      });

      await task.save();

      // Add action
      result.actions.push({
        type: RemediationActionType.SCHEDULE_REVIEW,
        description: `Scheduled review session for ${suggestion.relatedTopic.name}`,
        topicId,
        taskId: task._id.toString(),
        alertId: suggestion._id.toString(),
        metadata: {
          startTime: scheduledTime.startTime,
          endTime: scheduledTime.endTime,
          duration: scheduledTime.duration
        }
      });

      // Update summary
      result.summary.byType[RemediationActionType.SCHEDULE_REVIEW]++;
      result.summary.byTopic[topicId] = (result.summary.byTopic[topicId] || 0) + 1;

      // Add to scheduled reviews
      result.scheduledReviews.push({
        ...task.toObject(),
        topic: suggestion.relatedTopic
      });

      // Update the suggestion to reference the scheduled task
      await Alert.findByIdAndUpdate(suggestion._id, {
        $set: {
          'metadata.scheduledTaskId': task._id.toString(),
          'metadata.suggestedAction': `Complete the scheduled review session on ${scheduledTime.startTime.toLocaleDateString()} at ${scheduledTime.startTime.toLocaleTimeString()}`
        }
      });
    } catch (error) {
      console.error(`Error scheduling review for topic ${topicId}:`, error);
    }
  }
}

/**
 * Prepare AI Tutor sessions for topics that need immediate assistance
 */
async function prepareAITutorSessions(
  userId: string,
  suggestions: any[],
  result: RemediationAgentResult
): Promise<void> {
  // Get remediation suggestions that need AI Tutor sessions
  const tutorSuggestions = suggestions.filter(suggestion =>
    suggestion.metadata.remediationType === 'AI_TUTOR_SESSION' &&
    suggestion.relatedTopic
  );

  // Skip if no tutor suggestions
  if (tutorSuggestions.length === 0) {
    return;
  }

  // Prepare tutor sessions
  for (const suggestion of tutorSuggestions) {
    const topicId = suggestion.relatedTopic._id.toString();

    try {
      // Generate a personalized prompt for this topic
      const topic = await Topic.findById(topicId);
      if (!topic) continue;

      // Get user's performance on this topic
      const performances = await Performance.find({
        user: userId,
        topic: topicId
      }).sort({ createdAt: -1 }).limit(5);

      // Calculate average score and confidence
      const scores = performances.filter(p => p.score !== undefined).map(p => p.score);
      const avgScore = scores.length > 0
        ? scores.reduce((sum, score) => sum + (score || 0), 0) / scores.length
        : null;
      const avgConfidence = performances.length > 0
        ? performances.reduce((sum, p) => sum + p.confidence, 0) / performances.length
        : 3;

      // Generate a personalized prompt if one doesn't exist
      if (!suggestion.metadata.aiPrompt) {
        const prompt = `I need help understanding ${topic.name}. My average score on this topic is ${avgScore !== null ? Math.round(avgScore) + '%' : 'unknown'} and my confidence level is ${avgConfidence.toFixed(1)}/5. Can you explain the key concepts and provide some practice questions?`;

        // Update the suggestion with the prompt
        await Alert.findByIdAndUpdate(suggestion._id, {
          $set: {
            'metadata.aiPrompt': prompt
          }
        });

        suggestion.metadata.aiPrompt = prompt;
      }

      // Add action
      result.actions.push({
        type: RemediationActionType.START_TUTOR_SESSION,
        description: `Prepared AI Tutor session for ${topic.name}`,
        topicId,
        alertId: suggestion._id.toString(),
        metadata: {
          prompt: suggestion.metadata.aiPrompt,
          averageScore: avgScore,
          averageConfidence: avgConfidence
        }
      });

      // Update summary
      result.summary.byType[RemediationActionType.START_TUTOR_SESSION]++;
      result.summary.byTopic[topicId] = (result.summary.byTopic[topicId] || 0) + 1;
    } catch (error) {
      console.error(`Error preparing AI Tutor session for topic ${topicId}:`, error);
    }
  }
}

/**
 * Track the effectiveness of remediation actions
 * @param userId User ID
 * @param actionType Type of remediation action
 * @param topicId Topic ID
 * @param metadata Additional metadata
 */
export async function trackRemediationEffectiveness(
  userId: string,
  actionType: RemediationActionType,
  topicId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await dbConnect();

  try {
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Get study plan
    const studyPlan = await StudyPlan.findOne({ user: userId });
    if (!studyPlan) {
      throw new Error(`Study plan not found for user: ${userId}`);
    }

    // Find or create a task for this remediation action
    let taskId = metadata?.taskId;

    // If no task ID is provided, create a placeholder task
    if (!taskId) {
      // Check if we have a topic
      if (!topicId) {
        throw new Error('Either taskId or topicId must be provided');
      }

      // Create a placeholder task for tracking purposes
      const placeholderTask = new Task({
        plan: studyPlan._id,
        title: `Remediation Action: ${actionType}`,
        description: `Automatically generated task for tracking remediation action`,
        type: 'REVIEW',
        status: 'COMPLETED',
        startTime: new Date(),
        endTime: new Date(),
        duration: metadata?.duration || 15,
        topic: topicId,
        difficulty: 'MEDIUM',
        metadata: {
          isPlaceholder: true,
          actionType,
          ...metadata
        }
      });

      const savedTask = await placeholderTask.save();
      taskId = savedTask._id;
    }

    // Create a performance record to track this remediation action
    const performance = new Performance({
      user: userId,
      task: taskId,
      topic: topicId,
      timeSpent: metadata?.duration || 0,
      completed: true,
      confidence: metadata?.confidence || 3,
      type: 'REMEDIATION_ACTION',
      metadata: {
        actionType,
        timestamp: new Date(),
        ...metadata
      }
    });

    await performance.save();
  } catch (error) {
    console.error('Error tracking remediation effectiveness:', error);
  }
}
