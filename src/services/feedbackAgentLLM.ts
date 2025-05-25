import mongoose from 'mongoose';
import dbConnect from '../lib/db'; // Changed to relative
import {
  User,
  Feedback,
  StudyPlan,
  Performance
} from '../models/index'; // Changed to relative
import { generateAgentResponse } from './agentAI'; // Added .js
import { hashObject } from '../utils/serverCacheUtils'; // Changed to relative
import { testLLMResponse, LLMTestType } from '../utils/llmTesting'; // Changed to relative

/**
 * FeedbackAgentLLM - Enhanced Feedback Agent with LLM capabilities
 *
 * This service enhances the rule-based Feedback Agent with LLM capabilities for:
 * 1. Analyzing user feedback for sentiment and key issues
 * 2. Generating personalized responses to feedback
 * 3. Identifying patterns across multiple feedback items
 * 4. Suggesting system improvements based on feedback
 * 5. Providing confidence scores for analysis
 */

// Types for LLM-enhanced feedback
interface LLMFeedbackAnalysis {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  topics: string[];
  keyIssues: string[];
  suggestions: string[];
  praise: string[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
}

interface LLMFeedbackResponse {
  personalizedResponse: string;
  suggestedActions: Array<{
    type: 'SYSTEM_IMPROVEMENT' | 'FEATURE_REQUEST' | 'BUG_FIX' | 'CONTENT_IMPROVEMENT' | 'UX_IMPROVEMENT';
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  confidence: number;
  generatedAt: Date;
}

/**
 * Analyze user feedback using LLM
 * @param userId User ID
 * @param feedbackText The feedback text to analyze
 * @param feedbackHistory Previous feedback from the user
 * @returns LLM-enhanced feedback analysis
 */
export async function analyzeFeedbackWithLLM(
  userId: string,
  feedbackText: string,
  feedbackHistory: any[] = []
): Promise<LLMFeedbackAnalysis> {
  try {
    await dbConnect();

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Get recent performances to provide context
    const performances = await Performance.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Format performance data for the LLM
    const performanceData = performances.map(p => ({
      topic: p.topic ? p.topic.toString() : 'Unknown',
      score: p.score,
      confidence: p.confidenceLevel,
      date: p.createdAt
    }));

    // Format feedback history for the LLM
    const formattedHistory = feedbackHistory.map(f => ({
      date: f.createdAt,
      feedback: f.text,
      sentiment: f.sentiment || 'UNKNOWN'
    }));

    // Prepare context for the LLM
    const context = {
      userName: user.name || user.email.split('@')[0],
      userFeedback: feedbackText,
      feedbackHistory: formattedHistory,
      performanceData
    };

    // Generate a cache key based on the context
    const contextHash = hashObject({ feedbackText, userId });
    const cacheKey = `feedback_analysis_${userId}_${contextHash}`;

    // Generate prompt for the LLM
    const prompt = `
Analyze the following user feedback for a NCLEX study platform:

"${feedbackText}"

Provide a comprehensive analysis including:
1. Overall sentiment (POSITIVE, NEGATIVE, NEUTRAL, or MIXED)
2. Key topics mentioned
3. Specific issues or pain points
4. Suggestions for improvement
5. Positive aspects mentioned
6. Urgency level of addressing the feedback

Format your response as a JSON object with the following structure:
{
  "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED",
  "topics": ["topic1", "topic2", ...],
  "keyIssues": ["issue1", "issue2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "praise": ["praise1", "praise2", ...],
  "urgency": "LOW" | "MEDIUM" | "HIGH"
}
`;

    // Call the LLM
    const llmResponse = await generateAgentResponse(
      'feedback',
      prompt,
      context,
      cacheKey,
      60 * 60 * 1000 // 1 hour cache
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
      return generateFallbackAnalysis(feedbackText);
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
      return generateFallbackAnalysis(feedbackText);
    }

    // Create the final result
    const result: LLMFeedbackAnalysis = {
      sentiment: parsedResponse.sentiment || 'NEUTRAL',
      topics: parsedResponse.topics || [],
      keyIssues: parsedResponse.keyIssues || [],
      suggestions: parsedResponse.suggestions || [],
      praise: parsedResponse.praise || [],
      urgency: parsedResponse.urgency || 'MEDIUM',
      confidence: llmResponse.confidence || 0.7
    };

    return result;
  } catch (error) {
    console.error('Error analyzing feedback with LLM:', error);
    return generateFallbackAnalysis(feedbackText);
  }
}

/**
 * Generate a personalized response to user feedback using LLM
 * @param userId User ID
 * @param feedbackText The feedback text
 * @param analysis The feedback analysis
 * @returns LLM-generated personalized response
 */
export async function generateFeedbackResponseWithLLM(
  userId: string,
  feedbackText: string,
  analysis: LLMFeedbackAnalysis
): Promise<LLMFeedbackResponse> {
  try {
    await dbConnect();

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Prepare context for the LLM
    const context = {
      userName: user.name || user.email.split('@')[0],
      userFeedback: feedbackText,
      analysis
    };

    // Generate a cache key based on the context
    const contextHash = hashObject({ feedbackText, analysis, userId });
    const cacheKey = `feedback_response_${userId}_${contextHash}`;

    // Generate prompt for the LLM
    const prompt = `
Based on the following user feedback and analysis, generate a personalized response and suggest actions:

User Feedback: "${feedbackText}"

Analysis:
- Sentiment: ${analysis.sentiment}
- Topics: ${analysis.topics.join(', ')}
- Key Issues: ${analysis.keyIssues.join(', ')}
- Suggestions: ${analysis.suggestions.join(', ')}
- Praise: ${analysis.praise.join(', ')}
- Urgency: ${analysis.urgency}

Provide:
1. A personalized response acknowledging the feedback
2. Suggested actions to address the feedback

Format your response as a JSON object with the following structure:
{
  "personalizedResponse": "Your detailed response to the user",
  "suggestedActions": [
    {
      "type": "SYSTEM_IMPROVEMENT" | "FEATURE_REQUEST" | "BUG_FIX" | "CONTENT_IMPROVEMENT" | "UX_IMPROVEMENT",
      "description": "Description of the suggested action",
      "priority": "LOW" | "MEDIUM" | "HIGH"
    }
  ]
}
`;

    // Call the LLM
    const llmResponse = await generateAgentResponse(
      'feedback',
      prompt,
      context,
      cacheKey,
      60 * 60 * 1000 // 1 hour cache
    );

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
      return generateFallbackResponse(userId, feedbackText, analysis);
    }

    // Create the final result
    const result: LLMFeedbackResponse = {
      personalizedResponse: parsedResponse.personalizedResponse || '',
      suggestedActions: parsedResponse.suggestedActions || [],
      confidence: llmResponse.confidence || 0.7,
      generatedAt: new Date()
    };

    return result;
  } catch (error) {
    console.error('Error generating feedback response with LLM:', error);
    return generateFallbackResponse(userId, feedbackText, analysis);
  }
}

/**
 * Generate a fallback analysis when LLM fails
 * @param feedbackText The feedback text
 * @returns Fallback analysis
 */
function generateFallbackAnalysis(feedbackText: string): LLMFeedbackAnalysis {
  // Simple sentiment analysis based on keywords
  const positiveKeywords = ['good', 'great', 'excellent', 'love', 'like', 'helpful', 'useful', 'amazing', 'awesome'];
  const negativeKeywords = ['bad', 'poor', 'terrible', 'hate', 'dislike', 'unhelpful', 'useless', 'awful', 'horrible'];

  const lowercaseFeedback = feedbackText.toLowerCase();

  let positiveCount = 0;
  let negativeCount = 0;

  positiveKeywords.forEach(keyword => {
    if (lowercaseFeedback.includes(keyword)) positiveCount++;
  });

  negativeKeywords.forEach(keyword => {
    if (lowercaseFeedback.includes(keyword)) negativeCount++;
  });

  let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED' = 'NEUTRAL';

  if (positiveCount > 0 && negativeCount > 0) {
    sentiment = 'MIXED';
  } else if (positiveCount > 0) {
    sentiment = 'POSITIVE';
  } else if (negativeCount > 0) {
    sentiment = 'NEGATIVE';
  }

  return {
    sentiment,
    topics: [],
    keyIssues: [],
    suggestions: [],
    praise: [],
    urgency: 'MEDIUM',
    confidence: 0.5
  };
}

/**
 * Generate a fallback response when LLM fails
 * @param userId User ID
 * @param feedbackText The feedback text
 * @param analysis The feedback analysis
 * @returns Fallback response
 */
function generateFallbackResponse(
  userId: string,
  feedbackText: string,
  analysis: LLMFeedbackAnalysis
): LLMFeedbackResponse {
  let response = '';

  switch (analysis.sentiment) {
    case 'POSITIVE':
      response = "Thank you for your positive feedback! We're glad to hear you're enjoying your experience with our platform. We'll continue to work on making it even better for you.";
      break;
    case 'NEGATIVE':
      response = "Thank you for your feedback. We're sorry to hear about your concerns. We take all feedback seriously and will work on addressing these issues to improve your experience.";
      break;
    case 'MIXED':
      response = "Thank you for your feedback. We appreciate your balanced perspective, highlighting both positive aspects and areas for improvement. We'll work on addressing the concerns you've raised while maintaining the features you enjoy.";
      break;
    default:
      response = "Thank you for your feedback. We value your input and will use it to continue improving our platform.";
  }

  return {
    personalizedResponse: response,
    suggestedActions: [],
    confidence: 0.5,
    generatedAt: new Date()
  };
}
