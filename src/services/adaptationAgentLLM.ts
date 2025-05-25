import mongoose from 'mongoose';
import dbConnect from '../lib/db'; // Changed to relative
import {
  User,
  Task,
  Performance,
  StudyPlan,
  Alert,
  ReadinessScore,
  Topic
} from '../models/index'; // Changed to relative
import { generateAgentResponse } from './agentAI'; // Added .js
import { hashObject } from '../utils/serverCacheUtils'; // Changed to relative
import { testLLMResponse, LLMTestType } from '../utils/llmTesting'; // Changed to relative

/**
 * AdaptationAgentLLM - Enhanced Adaptation Agent with LLM capabilities
 *
 * This service enhances the rule-based Adaptation Agent with LLM capabilities for:
 * 1. Generating personalized adaptation recommendations
 * 2. Providing natural language explanations for adaptations
 * 3. Prioritizing adaptations based on student needs
 * 4. Balancing short-term and long-term goals
 * 5. Providing confidence scores for recommendations
 */

// Types for LLM-enhanced adaptation
interface LLMAdaptation {
  type: 'RESCHEDULE_TASK' | 'ADJUST_DIFFICULTY' | 'ADD_REVIEW' | 'REBALANCE_WORKLOAD' | 'ADD_REMEDIAL_CONTENT' | 'ADJUST_STUDY_PATTERN';
  description: string;
  confidence: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  affectedTaskIds?: string[];
  relatedTopicId?: string;
  metadata?: Record<string, any>;
}

interface LLMAdaptationResult {
  adaptations: LLMAdaptation[];
  naturalLanguageSummary: string;
  confidence: number;
  generatedAt: Date;
}

/**
 * Generate LLM-powered adaptation recommendations
 * @param userId User ID
 * @param monitoringData Data from the Monitor Agent
 * @param currentPlan Current study plan data
 * @returns LLM-enhanced adaptation recommendations
 */
export async function generateLLMAdaptations(
  userId: string,
  monitoringData: any,
  currentPlan: any
): Promise<LLMAdaptationResult> {
  try {
    await dbConnect();

    // Get user and study plan
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const studyPlan = await StudyPlan.findOne({ user: userId });
    if (!studyPlan) {
      throw new Error(`Study plan not found for user: ${userId}`);
    }

    // Calculate days until exam
    const daysUntilExam = Math.ceil(
      (new Date(studyPlan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Get topic performance data
    const topicPerformance = await getTopicPerformanceData(userId);

    // Get all tasks for the user's study plan
    const tasks = await Task.find({ plan: studyPlan._id }).sort({ startTime: 1 });

    // Format tasks for the LLM
    const formattedTasks = tasks.map(task => ({
      id: task._id.toString(),
      title: task.title,
      type: task.type,
      status: task.status,
      difficulty: task.difficulty,
      startTime: task.startTime,
      endTime: task.endTime,
      topicId: task.topic ? task.topic.toString() : null
    }));

    // Prepare context for the LLM
    const context = {
      userName: user.name || user.email.split('@')[0],
      daysUntilExam,
      readinessScore: monitoringData.stats.readinessScore,
      alerts: monitoringData.alerts || [],
      currentPlan: {
        tasks: formattedTasks,
        examDate: studyPlan.examDate
      },
      topicPerformance,
      studyPatterns: monitoringData.studyPatterns || [],
      llmInsights: monitoringData.llmInsights || null
    };

    // Generate a cache key based on the context
    const contextHash = hashObject(context);
    const cacheKey = `adaptation_recommendations_${userId}_${contextHash}`;

    // Generate prompt for the LLM
    const prompt = `
Based on the student's monitoring data, alerts, and current study plan, provide:

1. Specific adaptation recommendations to improve their study effectiveness
2. Prioritized list of changes to their study plan
3. Explanations for each recommendation
4. A balanced approach addressing both immediate issues and long-term goals

Format your response as a JSON object with the following structure:
{
  "adaptations": [
    {
      "type": "RESCHEDULE_TASK" | "ADJUST_DIFFICULTY" | "ADD_REVIEW" | "REBALANCE_WORKLOAD" | "ADD_REMEDIAL_CONTENT" | "ADJUST_STUDY_PATTERN",
      "description": "Detailed description of the adaptation",
      "priority": "LOW" | "MEDIUM" | "HIGH",
      "affectedTaskIds": ["task-id-1", "task-id-2"],
      "relatedTopicId": "topic-id if applicable",
      "metadata": {
        // Additional details specific to the adaptation type
      }
    }
  ],
  "summary": "A natural language summary of all adaptations and their rationale"
}
`;

    // Call the LLM
    const llmResponse = await generateAgentResponse(
      'adaptation',
      prompt,
      context,
      cacheKey,
      30 * 60 * 1000 // 30 minute cache
    );

    // Test the LLM response
    const testResults = testLLMResponse(
      llmResponse.text,
      prompt,
      [LLMTestType.COHERENCE, LLMTestType.RELEVANCE, LLMTestType.COMPLETENESS]
    );

    // Check if the response passed all tests
    const passedAllTests = testResults.every(result => result.passed);

    // If the response didn't pass all tests, log the issues and use a fallback
    if (!passedAllTests) {
      console.warn('LLM response failed quality tests:', testResults.filter(r => !r.passed));
      return generateFallbackAdaptations(userId, monitoringData, context);
    }

    // Parse the LLM response
    let parsedResponse;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = llmResponse.text.match(/```json\n([\s\S]*?)\n```/) ||
                        llmResponse.text.match(/```\n([\s\S]*?)\n```/) ||
                        [null, llmResponse.text];

      const jsonString = jsonMatch[1] || llmResponse.text;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', parseError);
      return generateFallbackAdaptations(userId, monitoringData, context);
    }

    // Map the parsed adaptations to our internal format
    const adaptations: LLMAdaptation[] = (parsedResponse.adaptations || []).map((adaptation: any) => {
      return {
        type: adaptation.type,
        description: adaptation.description,
        confidence: llmResponse.confidence || 0.7,
        priority: adaptation.priority || 'MEDIUM',
        affectedTaskIds: adaptation.affectedTaskIds || [],
        relatedTopicId: adaptation.relatedTopicId,
        metadata: adaptation.metadata || {}
      };
    });

    // Create the final result
    const result: LLMAdaptationResult = {
      adaptations,
      naturalLanguageSummary: parsedResponse.summary || '',
      confidence: llmResponse.confidence || 0.7,
      generatedAt: new Date()
    };

    return result;
  } catch (error) {
    console.error('Error generating LLM adaptations:', error);
    throw error;
  }
}

/**
 * Generate fallback adaptations when LLM fails
 * @param userId User ID
 * @param monitoringData Data from the Monitor Agent
 * @param context Context data
 * @returns Fallback adaptations
 */
function generateFallbackAdaptations(
  userId: string,
  monitoringData: any,
  context: any
): LLMAdaptationResult {
  // Create basic adaptations based on alerts
  const adaptations: LLMAdaptation[] = [];

  // Process missed task alerts
  const missedTaskAlerts = monitoringData.alerts.filter((a: any) => a.type === 'MISSED_TASK');
  missedTaskAlerts.forEach((alert: any) => {
    if (alert.relatedTaskId) {
      adaptations.push({
        type: 'RESCHEDULE_TASK',
        description: `Reschedule missed task "${alert.metadata?.taskTitle || 'Unknown Task'}" to the next available slot`,
        confidence: 0.9,
        priority: alert.severity,
        affectedTaskIds: [alert.relatedTaskId],
        metadata: {
          reason: 'task_missed',
          originalStartTime: alert.metadata?.originalStartTime,
          originalEndTime: alert.metadata?.originalEndTime
        }
      });
    }
  });

  // Process topic difficulty alerts
  const topicDifficultyAlerts = monitoringData.alerts.filter((a: any) => a.type === 'TOPIC_DIFFICULTY');
  topicDifficultyAlerts.forEach((alert: any) => {
    if (alert.relatedTopicId) {
      adaptations.push({
        type: 'ADD_REMEDIAL_CONTENT',
        description: `Add remedial content for topic "${alert.metadata?.topicName || 'Unknown Topic'}" to address performance issues`,
        confidence: 0.9,
        priority: alert.severity,
        relatedTopicId: alert.relatedTopicId,
        metadata: {
          topicName: alert.metadata?.topicName,
          averageScore: alert.metadata?.averageScore
        }
      });
    }
  });

  // Add workload rebalancing if there are many missed tasks
  if (missedTaskAlerts.length > 5) {
    adaptations.push({
      type: 'REBALANCE_WORKLOAD',
      description: 'Rebalance study workload to make the schedule more manageable',
      confidence: 0.8,
      priority: 'MEDIUM',
      metadata: {
        reason: 'too_many_missed_tasks',
        missedTaskCount: missedTaskAlerts.length
      }
    });
  }

  // Create a summary
  const summary = `Based on your recent performance and missed tasks, I recommend rescheduling missed tasks and adding remedial content for topics where you're struggling. ${missedTaskAlerts.length > 5 ? 'I also suggest rebalancing your workload to make your schedule more manageable.' : ''}`;

  return {
    adaptations,
    naturalLanguageSummary: summary,
    confidence: 0.8,
    generatedAt: new Date()
  };
}

/**
 * Get topic performance data for a user
 * @param userId User ID
 * @returns Array of topic performance data
 */
async function getTopicPerformanceData(userId: string): Promise<any[]> {
  // Get all topics
  const topics = await Topic.find();

  // Get performances for each topic
  const topicPerformance = await Promise.all(
    topics.map(async (topic) => {
      const performances = await Performance.find({
        user: userId,
        topic: topic._id
      }).sort({ createdAt: -1 });

      // Calculate average score
      const scores = performances.map(p => p.score).filter(s => s !== null) as number[];
      const avgScore = scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : null;

      // Determine status
      let status = 'NOT_STARTED';
      if (performances.length > 0) {
        status = avgScore !== null && avgScore >= 70 ? 'STRONG' : 'NEEDS_IMPROVEMENT';
      }

      return {
        id: topic._id.toString(),
        name: topic.name,
        category: topic.category,
        score: avgScore,
        status,
        lastStudied: performances.length > 0 ? performances[0].createdAt : null,
        sessionsCompleted: performances.length
      };
    })
  );

  return topicPerformance;
}
