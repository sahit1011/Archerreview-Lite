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
 * MonitorAgentLLM - Enhanced Monitor Agent with LLM capabilities
 *
 * This service enhances the rule-based Monitor Agent with LLM capabilities for:
 * 1. Generating deeper insights from performance data
 * 2. Creating natural language explanations for detected patterns
 * 3. Predicting future performance based on current trends
 * 4. Generating personalized recommendations
 * 5. Providing confidence scores for insights
 */

// Types for LLM-enhanced monitoring
interface LLMInsight {
  type: 'STRENGTH' | 'WEAKNESS' | 'PATTERN' | 'PREDICTION' | 'RECOMMENDATION';
  description: string;
  confidence: number;
  relatedTopicId?: string;
  relatedTaskId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  metadata?: Record<string, any>;
}

interface LLMMonitoringResult {
  insights: LLMInsight[];
  naturalLanguageSummary: string;
  confidence: number;
  generatedAt: Date;
}

/**
 * Generate LLM-powered insights based on monitoring data
 * @param userId User ID
 * @param monitoringData Data from the rule-based monitor agent
 * @returns LLM-enhanced insights
 */
export async function generateLLMInsights(
  userId: string,
  monitoringData: any
): Promise<LLMMonitoringResult> {
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

    // Get recent performances
    const performances = await Performance.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('topic');

    // Format performance data for the LLM
    const performanceData = performances.map(p => ({
      topic: p.topic.name,
      score: p.score,
      confidence: p.confidenceLevel,
      date: p.createdAt
    }));

    // Prepare context for the LLM
    const context = {
      userName: user.name || user.email.split('@')[0],
      daysUntilExam,
      readinessScore: monitoringData.stats.readinessScore,
      performanceData,
      studyPatterns: monitoringData.studyPatterns || [],
      missedTasks: monitoringData.stats.missedTasks,
      totalTasks: monitoringData.stats.totalTasks,
      completedTasks: monitoringData.stats.completedTasks,
      averagePerformance: monitoringData.stats.averagePerformance,
      topicPerformance,
      alerts: monitoringData.alerts || []
    };

    // Generate a cache key based on the context
    const contextHash = hashObject(context);
    const cacheKey = `monitor_insights_${userId}_${contextHash}`;

    // Generate prompt for the LLM
    const prompt = `
Based on the student's performance data, study patterns, and current alerts, provide:

1. A comprehensive analysis of their study effectiveness
2. Key insights about strengths and weaknesses
3. Patterns in their study behavior
4. Predictions about future performance if current trends continue
5. Specific, actionable recommendations prioritized by importance

Format your response as a JSON object with the following structure:
{
  "insights": [
    {
      "type": "STRENGTH" | "WEAKNESS" | "PATTERN" | "PREDICTION" | "RECOMMENDATION",
      "description": "Detailed description of the insight",
      "priority": "LOW" | "MEDIUM" | "HIGH",
      "relatedTopic": "Topic name if applicable"
    }
  ],
  "summary": "A natural language summary of all insights and recommendations"
}
`;

    // Call the LLM
    const llmResponse = await generateAgentResponse(
      'monitor',
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
      return generateFallbackInsights(userId, monitoringData, context);
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
      return generateFallbackInsights(userId, monitoringData, context);
    }

    // Map the parsed insights to our internal format
    const insights: LLMInsight[] = (parsedResponse.insights || []).map((insight: any) => {
      // Find related topic ID if a topic name is provided
      let relatedTopicId: string | undefined = undefined;
      if (insight.relatedTopic) {
        const matchingTopic = topicPerformance.find(
          t => t.name.toLowerCase() === insight.relatedTopic.toLowerCase()
        );
        if (matchingTopic) {
          relatedTopicId = matchingTopic.id;
        }
      }

      return {
        type: insight.type,
        description: insight.description,
        confidence: llmResponse.confidence || 0.7,
        priority: insight.priority || 'MEDIUM',
        relatedTopicId,
        metadata: insight.metadata || {}
      };
    });

    // Create the final result
    const result: LLMMonitoringResult = {
      insights,
      naturalLanguageSummary: parsedResponse.summary || '',
      confidence: llmResponse.confidence || 0.7,
      generatedAt: new Date()
    };

    return result;
  } catch (error) {
    console.error('Error generating LLM insights:', error);
    throw error;
  }
}

/**
 * Generate fallback insights when LLM fails
 * @param userId User ID
 * @param monitoringData Data from the rule-based monitor agent
 * @param context Context data
 * @returns Fallback insights
 */
function generateFallbackInsights(
  userId: string,
  monitoringData: any,
  context: any
): LLMMonitoringResult {
  // Create basic insights based on rule-based alerts
  const insights: LLMInsight[] = monitoringData.alerts.map((alert: any) => {
    let type: LLMInsight['type'] = 'PATTERN';

    if (alert.type === 'MISSED_TASK') type = 'WEAKNESS';
    if (alert.type === 'LOW_PERFORMANCE') type = 'WEAKNESS';
    if (alert.type === 'TOPIC_DIFFICULTY') type = 'WEAKNESS';
    if (alert.type === 'SCHEDULE_DEVIATION') type = 'PATTERN';

    return {
      type,
      description: alert.message,
      confidence: 0.9, // High confidence since it's rule-based
      priority: alert.severity,
      relatedTopicId: alert.relatedTopicId,
      relatedTaskId: alert.relatedTaskId,
      metadata: alert.metadata
    };
  });

  // Add a generic recommendation
  insights.push({
    type: 'RECOMMENDATION',
    description: `Focus on maintaining a consistent study schedule and prioritize topics with lower performance scores.`,
    confidence: 0.8,
    priority: 'MEDIUM',
    metadata: {}
  });

  // Add a strength if performance is good
  if (monitoringData.stats.averagePerformance > 70) {
    insights.push({
      type: 'STRENGTH',
      description: `Your overall performance of ${monitoringData.stats.averagePerformance}% shows good progress. Continue with your current approach to maintain this level.`,
      confidence: 0.8,
      priority: 'MEDIUM',
      metadata: {}
    });
  }

  // Create a summary
  const summary = `Based on your recent performance, you should focus on addressing missed tasks and improving in challenging topics. Maintain a consistent study schedule and allocate more time to areas where your performance is lower.`;

  return {
    insights,
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

/**
 * Generate alerts from LLM insights
 * @param userId User ID
 * @param planId Study plan ID
 * @param insights LLM-generated insights
 * @returns Created alerts
 */
export async function generateAlertsFromInsights(
  userId: string,
  planId: mongoose.Types.ObjectId,
  insights: LLMInsight[]
): Promise<any[]> {
  // Connect to the database
  await dbConnect();

  // Convert insights to alerts
  const alerts = insights
    .filter(insight =>
      // Only create alerts for weaknesses, patterns, and high-priority recommendations
      insight.type === 'WEAKNESS' ||
      insight.type === 'PATTERN' ||
      (insight.type === 'RECOMMENDATION' && insight.priority === 'HIGH')
    )
    .map(insight => {
      // Map insight type to alert type
      let alertType: string;
      switch (insight.type) {
        case 'WEAKNESS':
          alertType = insight.relatedTopicId ? 'TOPIC_DIFFICULTY' : 'LOW_PERFORMANCE';
          break;
        case 'PATTERN':
          alertType = 'STUDY_PATTERN';
          break;
        case 'RECOMMENDATION':
          alertType = 'GENERAL';
          break;
        default:
          alertType = 'GENERAL';
      }

      // Create alert object
      return {
        user: userId,
        plan: planId,
        type: alertType,
        severity: insight.priority,
        message: insight.description,
        relatedTopic: insight.relatedTopicId,
        relatedTask: insight.relatedTaskId,
        metadata: {
          ...insight.metadata,
          insightType: insight.type,
          confidence: insight.confidence,
          llmGenerated: true
        }
      };
    });

  // Save alerts to database
  const createdAlerts = await Alert.create(alerts);

  return createdAlerts;
}
