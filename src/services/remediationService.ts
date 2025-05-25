import mongoose from 'mongoose';
import dbConnect from '../lib/db'; // Changed to relative
import {
  User,
  Task,
  Performance,
  StudyPlan,
  Alert,
  ReadinessScore,
  Topic,
  Content
} from '../models/index'; // Changed to relative
import { generateTutorResponse } from './generativeAI'; // Added .js

/**
 * RemediationService - Responsible for proactive remediation suggestions
 *
 * This service handles:
 * 1. Performance monitoring triggers for remediation
 * 2. Concept difficulty detection
 * 3. Contextual help suggestion system
 * 4. Resource recommendation algorithm
 * 5. Non-intrusive UI for remediation prompts
 */

// Types of remediation suggestions
export enum RemediationType {
  CONCEPT_REVIEW = 'CONCEPT_REVIEW',
  PRACTICE_QUESTIONS = 'PRACTICE_QUESTIONS',
  VIDEO_TUTORIAL = 'VIDEO_TUTORIAL',
  STUDY_TECHNIQUE = 'STUDY_TECHNIQUE',
  AI_TUTOR_SESSION = 'AI_TUTOR_SESSION'
}

// Interface for remediation results
export interface RemediationResult {
  userId: string;
  planId: string;
  remediations: RemediationSuggestion[];
  summary: {
    totalSuggestions: number;
    byType: Record<RemediationType, number>;
    byTopic: Record<string, number>;
  };
}

// Interface for individual remediation suggestions
export interface RemediationSuggestion {
  type: RemediationType;
  title: string;
  description: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  topicId?: string;
  resourceId?: string;
  suggestedAction?: string;
  aiPrompt?: string;
  metadata?: Record<string, any>;
}

/**
 * Generate proactive remediation suggestions for a user
 * @param userId User ID to generate remediation suggestions for
 * @returns Remediation suggestions
 */
export async function generateRemediationSuggestions(userId: string): Promise<RemediationResult> {
  await dbConnect();

  try {
    console.log(`Generating remediation suggestions for user: ${userId}`);

    // Get user and study plan
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found: ${userId}`);
      throw new Error(`User not found: ${userId}`);
    }
    console.log(`Found user: ${user.email}`);

    const studyPlan = await StudyPlan.findOne({ user: userId });
    if (!studyPlan) {
      console.log(`Study plan not found for user: ${userId}`);
      throw new Error(`Study plan not found for user: ${userId}`);
    }
    console.log(`Found study plan: ${studyPlan._id}`);

    // Initialize remediation result
    const result: RemediationResult = {
      userId,
      planId: studyPlan._id.toString(),
      remediations: [],
      summary: {
        totalSuggestions: 0,
        byType: {
          [RemediationType.CONCEPT_REVIEW]: 0,
          [RemediationType.PRACTICE_QUESTIONS]: 0,
          [RemediationType.VIDEO_TUTORIAL]: 0,
          [RemediationType.STUDY_TECHNIQUE]: 0,
          [RemediationType.AI_TUTOR_SESSION]: 0
        },
        byTopic: {}
      }
    };

    // Get all tasks for the user's study plan
    const tasks = await Task.find({ plan: studyPlan._id }).populate('topic');

    // Get all performances for the user
    const performances = await Performance.find({ user: userId });

    // Get readiness score
    const readinessScore = await ReadinessScore.findOne({ user: userId }).sort({ createdAt: -1 });

    // Get all topics
    const topics = await Topic.find({});

    // Get all content
    const contents = await Content.find({});

    // Run remediation processes
    await Promise.all([
      detectConceptDifficulties(userId, studyPlan._id, tasks, performances, topics, contents, result),
      suggestStudyTechniques(userId, studyPlan._id, tasks, performances, readinessScore, result),
      recommendAITutorSessions(userId, studyPlan._id, tasks, performances, topics, result)
    ]);

    // Update summary
    result.summary.totalSuggestions = result.remediations.length;

    // Save remediation suggestions as alerts
    await saveRemediationAlerts(userId, studyPlan._id, result.remediations);

    console.log(`Generated ${result.remediations.length} remediation suggestions`);
    console.log(`Remediation summary:`, result.summary);

    return result;
  } catch (error) {
    console.error('Error generating remediation suggestions:', error);
    throw error;
  }
}

/**
 * Detect concept difficulties and suggest remediation
 */
async function detectConceptDifficulties(
  userId: string,
  planId: mongoose.Types.ObjectId,
  tasks: any[],
  performances: any[],
  topics: any[],
  contents: any[],
  result: RemediationResult
): Promise<void> {
  // Group performances by topic
  const topicPerformances = new Map<string, any[]>();

  // Populate topic performance data
  for (const perf of performances) {
    if (!perf.topic) continue;

    const topicId = perf.topic.toString();
    if (!topicPerformances.has(topicId)) {
      topicPerformances.set(topicId, []);
    }

    topicPerformances.get(topicId)?.push({
      score: perf.score || 0,
      confidence: perf.confidence,
      timeSpent: perf.timeSpent,
      createdAt: perf.createdAt
    });
  }

  // Check each topic for difficulties
  for (const [topicId, perfs] of topicPerformances.entries()) {
    // Skip if not enough data
    if (perfs.length < 2) continue;

    // Calculate average score for the topic
    const totalScore = perfs.reduce((sum, p) => sum + p.score, 0);
    const avgScore = perfs.length > 0 ? totalScore / perfs.length : 0;

    // Calculate average confidence
    const totalConfidence = perfs.reduce((sum, p) => sum + p.confidence, 0);
    const avgConfidence = perfs.length > 0 ? totalConfidence / perfs.length : 0;

    // Get topic details
    const topic = topics.find(t => t._id.toString() === topicId);
    if (!topic) continue;

    // Check if performance is below threshold
    if (avgScore < 70 || avgConfidence < 3) {
      // Find relevant content for this topic
      const relevantContent = contents.filter(c =>
        c.topics.some((t: any) => t.toString() === topicId)
      );

      // Determine remediation type based on performance
      let remediationType: RemediationType;
      let urgency: 'LOW' | 'MEDIUM' | 'HIGH';

      if (avgScore < 50) {
        remediationType = RemediationType.CONCEPT_REVIEW;
        urgency = 'HIGH';
      } else if (avgScore < 60) {
        remediationType = RemediationType.VIDEO_TUTORIAL;
        urgency = 'MEDIUM';
      } else {
        remediationType = RemediationType.PRACTICE_QUESTIONS;
        urgency = 'LOW';
      }

      // Find the best resource for remediation
      const recommendedResource = findBestResource(relevantContent, remediationType);

      // Create remediation suggestion
      const suggestion: RemediationSuggestion = {
        type: remediationType,
        title: `Improve your understanding of ${topic.name}`,
        description: `Your performance in ${topic.name} is below target (${Math.round(avgScore)}%). Additional practice is recommended.`,
        urgency,
        topicId,
        resourceId: recommendedResource?._id.toString(),
        suggestedAction: getSuggestedAction(remediationType, recommendedResource),
        aiPrompt: getAIPrompt(remediationType, topic.name),
        metadata: {
          topicName: topic.name,
          averageScore: avgScore,
          averageConfidence: avgConfidence,
          performanceCount: perfs.length,
          resourceTitle: recommendedResource?.title,
          resourceType: recommendedResource?.type
        }
      };

      // Add to result
      result.remediations.push(suggestion);

      // Update summary
      result.summary.byType[remediationType]++;
      result.summary.byTopic[topicId] = (result.summary.byTopic[topicId] || 0) + 1;
    }
  }
}

/**
 * Suggest study techniques based on performance patterns
 */
async function suggestStudyTechniques(
  userId: string,
  planId: mongoose.Types.ObjectId,
  tasks: any[],
  performances: any[],
  readinessScore: any,
  result: RemediationResult
): Promise<void> {
  // Skip if not enough data
  if (performances.length < 3) return;

  // Analyze study patterns
  const completedTasks = tasks.filter(task => task.status === 'COMPLETED');
  if (completedTasks.length < 3) return;

  // Check for inconsistent study patterns
  const taskCompletions = new Map<string, any>();
  performances.forEach(perf => {
    if (perf.completed && perf.task) {
      taskCompletions.set(perf.task.toString(), {
        completedAt: perf.createdAt,
        score: perf.score || 0,
        confidence: perf.confidence
      });
    }
  });

  // Sort performances by date
  const sortedPerformances = [...performances]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Calculate days between study sessions
  const daysBetweenSessions = [];
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
    const avgGap = daysBetweenSessions.reduce((sum, days) => sum + days, 0) / daysBetweenSessions.length;

    if (maxGap > 3 || avgGap > 2) {
      // Suggest spaced repetition technique
      result.remediations.push({
        type: RemediationType.STUDY_TECHNIQUE,
        title: 'Improve your study consistency',
        description: `There are gaps in your study schedule. Consistent, spaced practice is more effective than cramming.`,
        urgency: maxGap > 5 ? 'HIGH' : 'MEDIUM',
        suggestedAction: 'Try the Pomodoro Technique: 25 minutes of focused study followed by a 5-minute break.',
        aiPrompt: 'What are effective study techniques for consistent learning?',
        metadata: {
          maxGap,
          avgGap,
          technique: 'Spaced Repetition',
          alternativeTechnique: 'Pomodoro Technique'
        }
      });

      // Update summary
      result.summary.byType[RemediationType.STUDY_TECHNIQUE]++;
    }
  }

  // Check for declining performance trend
  if (sortedPerformances.length >= 5) {
    // Get the 5 most recent performances
    const recentPerformances = sortedPerformances.slice(-5);

    // Calculate average score for first half and second half
    const firstHalfAvg = (recentPerformances[0].score || 0) + (recentPerformances[1].score || 0);
    const secondHalfAvg = (recentPerformances[3].score || 0) + (recentPerformances[4].score || 0);

    // Check if there's a significant decline (10% or more)
    if (secondHalfAvg < firstHalfAvg * 0.9) {
      // Suggest active recall technique
      result.remediations.push({
        type: RemediationType.STUDY_TECHNIQUE,
        title: 'Boost your learning effectiveness',
        description: 'Your recent performance is declining. Try active recall techniques to improve retention.',
        urgency: 'MEDIUM',
        suggestedAction: 'After studying a concept, close your materials and explain it out loud as if teaching someone else.',
        aiPrompt: 'How can I use active recall to improve my NCLEX preparation?',
        metadata: {
          recentScores: recentPerformances.map(p => p.score || 0),
          trend: 'declining',
          technique: 'Active Recall',
          alternativeTechnique: 'Feynman Technique'
        }
      });

      // Update summary
      result.summary.byType[RemediationType.STUDY_TECHNIQUE]++;
    }
  }
}

/**
 * Recommend AI tutor sessions for complex topics
 */
async function recommendAITutorSessions(
  userId: string,
  planId: mongoose.Types.ObjectId,
  tasks: any[],
  performances: any[],
  topics: any[],
  result: RemediationResult
): Promise<void> {
  // Group performances by topic
  const topicPerformances = new Map<string, any[]>();

  // Populate topic performance data
  for (const perf of performances) {
    if (!perf.topic) continue;

    const topicId = perf.topic.toString();
    if (!topicPerformances.has(topicId)) {
      topicPerformances.set(topicId, []);
    }

    topicPerformances.get(topicId)?.push({
      score: perf.score || 0,
      confidence: perf.confidence,
      timeSpent: perf.timeSpent,
      createdAt: perf.createdAt
    });
  }

  // Find topics with consistently low confidence but varying scores
  for (const [topicId, perfs] of topicPerformances.entries()) {
    // Skip if not enough data
    if (perfs.length < 3) continue;

    // Calculate average confidence
    const totalConfidence = perfs.reduce((sum, p) => sum + p.confidence, 0);
    const avgConfidence = perfs.length > 0 ? totalConfidence / perfs.length : 0;

    // Calculate score variance
    const avgScore = perfs.reduce((sum, p) => sum + p.score, 0) / perfs.length;
    const scoreVariance = perfs.reduce((sum, p) => sum + Math.pow(p.score - avgScore, 2), 0) / perfs.length;

    // Get topic details
    const topic = topics.find(t => t._id.toString() === topicId);
    if (!topic) continue;

    // Check if confidence is low but scores are variable
    if (avgConfidence < 3 && scoreVariance > 100) {
      // This indicates the student might understand parts but is unsure overall
      // Perfect case for AI tutor intervention

      // Generate a tailored AI prompt for this topic
      const aiPrompt = `I'm struggling with ${topic.name} in my NCLEX preparation. My scores are inconsistent and my confidence is low. Can you explain the key concepts I should focus on?`;

      // Create remediation suggestion
      result.remediations.push({
        type: RemediationType.AI_TUTOR_SESSION,
        title: `Get personalized help with ${topic.name}`,
        description: `You seem to understand parts of ${topic.name} but your confidence is low. A personalized AI tutor session could help clarify concepts.`,
        urgency: 'MEDIUM',
        topicId,
        suggestedAction: 'Start a chat with the AI tutor about this topic',
        aiPrompt,
        metadata: {
          topicName: topic.name,
          averageConfidence: avgConfidence,
          scoreVariance,
          averageScore: avgScore,
          performanceCount: perfs.length
        }
      });

      // Update summary
      result.summary.byType[RemediationType.AI_TUTOR_SESSION]++;
      result.summary.byTopic[topicId] = (result.summary.byTopic[topicId] || 0) + 1;
    }
  }
}

/**
 * Find the best resource for remediation
 */
function findBestResource(resources: any[], type: RemediationType): any {
  if (resources.length === 0) return null;

  // Filter resources by type
  let filteredResources = resources;

  switch (type) {
    case RemediationType.CONCEPT_REVIEW:
      filteredResources = resources.filter(r => r.type === 'READING');
      break;
    case RemediationType.PRACTICE_QUESTIONS:
      filteredResources = resources.filter(r => r.type === 'QUIZ');
      break;
    case RemediationType.VIDEO_TUTORIAL:
      filteredResources = resources.filter(r => r.type === 'VIDEO');
      break;
    default:
      // Use all resources if no specific type matches
      break;
  }

  // If no resources of the preferred type, use any available
  if (filteredResources.length === 0) {
    filteredResources = resources;
  }

  // Sort by relevance (in a real implementation, this would use more sophisticated logic)
  // For now, just return the first one
  return filteredResources[0];
}

/**
 * Get suggested action based on remediation type
 */
function getSuggestedAction(type: RemediationType, resource: any): string {
  if (!resource) {
    return 'Review your notes on this topic';
  }

  switch (type) {
    case RemediationType.CONCEPT_REVIEW:
      return `Read "${resource.title}" to strengthen your understanding`;
    case RemediationType.PRACTICE_QUESTIONS:
      return `Complete the practice questions in "${resource.title}"`;
    case RemediationType.VIDEO_TUTORIAL:
      return `Watch the tutorial video "${resource.title}"`;
    case RemediationType.STUDY_TECHNIQUE:
      return 'Try a new study technique to improve retention';
    case RemediationType.AI_TUTOR_SESSION:
      return 'Chat with the AI tutor about this topic';
    default:
      return 'Review this topic to improve your understanding';
  }
}

/**
 * Get AI prompt based on remediation type
 */
function getAIPrompt(type: RemediationType, topicName: string): string {
  switch (type) {
    case RemediationType.CONCEPT_REVIEW:
      return `Can you explain the key concepts of ${topicName} in simple terms?`;
    case RemediationType.PRACTICE_QUESTIONS:
      return `Can you give me some practice questions about ${topicName}?`;
    case RemediationType.VIDEO_TUTORIAL:
      return `What are the most important points to understand about ${topicName}?`;
    case RemediationType.STUDY_TECHNIQUE:
      return `What are effective study techniques for learning ${topicName}?`;
    case RemediationType.AI_TUTOR_SESSION:
      return `I'm struggling with ${topicName}. Can you help me understand it better?`;
    default:
      return `Can you help me with ${topicName}?`;
  }
}

/**
 * Save remediation suggestions as alerts
 */
async function saveRemediationAlerts(
  userId: string,
  planId: mongoose.Types.ObjectId,
  remediations: RemediationSuggestion[]
): Promise<void> {
  // Skip if no remediations
  if (remediations.length === 0) return;

  // Get existing remediation alerts for this user
  const existingAlerts = await Alert.find({
    user: userId,
    type: 'REMEDIATION',
    isResolved: false
  });

  // Create a set of topics that already have remediation suggestions
  const existingTopics = new Set(
    existingAlerts
      .filter(alert => alert.relatedTopic)
      .map(alert => alert.relatedTopic.toString())
  );

  // Filter out remediations for topics that already have suggestions
  const uniqueRemediations = remediations.filter(remediation => {
    // If no topic ID, or topic doesn't already have a suggestion, include it
    return !remediation.topicId || !existingTopics.has(remediation.topicId);
  });

  // Skip if no unique remediations
  if (uniqueRemediations.length === 0) return;

  // Create alert documents
  const alertDocs = uniqueRemediations.map(remediation => ({
    user: userId,
    plan: planId,
    type: 'REMEDIATION',
    severity: remediation.urgency,
    message: remediation.description,
    relatedTopic: remediation.topicId,
    metadata: {
      ...remediation.metadata,
      remediationType: remediation.type,
      title: remediation.title,
      suggestedAction: remediation.suggestedAction,
      aiPrompt: remediation.aiPrompt,
      resourceId: remediation.resourceId
    },
    isResolved: false
  }));

  // Save alerts to database
  if (alertDocs.length > 0) {
    await Alert.insertMany(alertDocs);
  }
}

/**
 * Get all remediation suggestions for a user
 */
export async function getRemediationSuggestions(userId: string): Promise<any[]> {
  await dbConnect();

  console.log(`Getting remediation suggestions for user: ${userId}`);

  const suggestions = await Alert.find({
    user: userId,
    type: 'REMEDIATION',
    isResolved: false
  })
  .populate('relatedTopic')
  .sort({ createdAt: -1 });

  console.log(`Found ${suggestions.length} remediation suggestions`);

  return suggestions;
}

/**
 * Mark a remediation suggestion as resolved
 */
export async function resolveRemediationSuggestion(suggestionId: string): Promise<any> {
  await dbConnect();

  return Alert.findByIdAndUpdate(
    suggestionId,
    {
      isResolved: true,
      resolvedAt: new Date()
    },
    { new: true }
  );
}

/**
 * Create a mock remediation suggestion for testing
 */
export async function createMockRemediationSuggestion(userId: string): Promise<any> {
  await dbConnect();

  console.log(`Creating mock remediation suggestion for user: ${userId}`);

  // Get user's study plan
  const studyPlan = await StudyPlan.findOne({ user: userId });
  if (!studyPlan) {
    console.log(`Study plan not found for user: ${userId}`);
    throw new Error(`Study plan not found for user: ${userId}`);
  }

  // Get existing remediation alerts for this user
  const existingAlerts = await Alert.find({
    user: userId,
    type: 'REMEDIATION',
    isResolved: false
  });

  // Create a set of topics that already have remediation suggestions
  const existingTopics = new Set(
    existingAlerts
      .filter(alert => alert.relatedTopic)
      .map(alert => alert.relatedTopic.toString())
  );

  // Get all topics
  const topics = await Topic.find({});

  // Filter out topics that already have remediation suggestions
  const availableTopics = topics.filter(topic =>
    !existingTopics.has(topic._id.toString())
  );

  // If all topics already have suggestions, use a random topic without a specific topic ID
  let randomTopic;
  let useGenericSuggestion = false;

  if (availableTopics.length === 0) {
    randomTopic = topics[Math.floor(Math.random() * topics.length)];
    useGenericSuggestion = true;
  } else {
    randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
  }

  // Create a mock alert
  const mockAlert = new Alert({
    user: userId,
    plan: studyPlan._id,
    type: 'REMEDIATION',
    severity: 'MEDIUM',
    message: useGenericSuggestion
      ? `Try a new study technique to improve your overall performance.`
      : `Your performance in ${randomTopic.name} is below target (65%). Additional practice is recommended.`,
    relatedTopic: useGenericSuggestion ? undefined : randomTopic._id,
    metadata: {
      remediationType: useGenericSuggestion ? 'STUDY_TECHNIQUE' : 'CONCEPT_REVIEW',
      title: useGenericSuggestion
        ? `Improve your study effectiveness`
        : `Improve your understanding of ${randomTopic.name}`,
      suggestedAction: useGenericSuggestion
        ? `Try the Pomodoro Technique: 25 minutes of focused study followed by a 5-minute break.`
        : `Read more about ${randomTopic.name} to strengthen your understanding`,
      aiPrompt: useGenericSuggestion
        ? `What are effective study techniques for NCLEX preparation?`
        : `Can you explain the key concepts of ${randomTopic.name} in simple terms?`,
      topicName: useGenericSuggestion ? undefined : randomTopic.name,
      averageScore: 65,
      averageConfidence: 2.5
    },
    isResolved: false
  });

  await mockAlert.save();
  console.log(`Created mock remediation suggestion with ID: ${mockAlert._id}`);

  return mockAlert;
}
