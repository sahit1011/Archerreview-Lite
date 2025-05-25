import mongoose from 'mongoose';
import dbConnect from '../lib/db'; // Changed to relative
import {
  User,
  Feedback,
  StudyPlan
} from '../models/index'; // Changed to relative
import { analyzeFeedbackWithLLM, generateFeedbackResponseWithLLM } from './feedbackAgentLLM';

/**
 * FeedbackAgent - Responsible for processing user feedback
 *
 * This service handles:
 * 1. Storing user feedback
 * 2. Analyzing feedback sentiment
 * 3. Generating personalized responses
 * 4. Identifying patterns across feedback
 * 5. Suggesting system improvements
 */

// Types of feedback analysis
export interface FeedbackAnalysis {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  topics: string[];
  keyIssues: string[];
  suggestions: string[];
  praise: string[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Interface for feedback processing results
export interface FeedbackResult {
  userId: string;
  feedbackId: string;
  analysis: FeedbackAnalysis;
  response: string;
  suggestedActions: Array<{
    type: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  llmEnhanced: boolean;
}

/**
 * Process user feedback
 * @param userId User ID
 * @param feedbackText Feedback text
 * @returns Feedback processing result
 */
export async function processFeedback(userId: string, feedbackText: string): Promise<FeedbackResult> {
  await dbConnect();

  try {
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Get previous feedback from this user
    const previousFeedback = await Feedback.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Initialize result
    let analysis: FeedbackAnalysis = {
      sentiment: 'NEUTRAL',
      topics: [],
      keyIssues: [],
      suggestions: [],
      praise: [],
      urgency: 'MEDIUM'
    };

    let response = '';
    let suggestedActions: Array<{
      type: string;
      description: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
    }> = [];
    let llmEnhanced = false;

    // Check if we should use LLM enhancements
    const useLLM = process.env.USE_LLM_FEEDBACK === 'true';

    if (useLLM) {
      try {
        console.log(`[FeedbackAgent] Analyzing feedback with LLM for user ${userId}`);

        // Analyze feedback with LLM
        const llmAnalysis = await analyzeFeedbackWithLLM(
          userId,
          feedbackText,
          previousFeedback
        );

        // Generate response with LLM
        const llmResponse = await generateFeedbackResponseWithLLM(
          userId,
          feedbackText,
          llmAnalysis
        );

        // Update result with LLM-enhanced data
        analysis = {
          sentiment: llmAnalysis.sentiment,
          topics: llmAnalysis.topics,
          keyIssues: llmAnalysis.keyIssues,
          suggestions: llmAnalysis.suggestions,
          praise: llmAnalysis.praise,
          urgency: llmAnalysis.urgency
        };

        response = llmResponse.personalizedResponse;
        suggestedActions = llmResponse.suggestedActions;
        llmEnhanced = true;

        console.log(`[FeedbackAgent] Generated LLM-enhanced feedback analysis and response for user ${userId}`);
      } catch (llmError) {
        console.error('[FeedbackAgent] Error using LLM for feedback:', llmError);
        // Continue with rule-based analysis if LLM fails
      }
    }

    // If LLM failed or is disabled, use rule-based analysis
    if (!llmEnhanced) {
      // Simple rule-based sentiment analysis
      const positiveKeywords = ['good', 'great', 'excellent', 'love', 'like', 'helpful', 'useful'];
      const negativeKeywords = ['bad', 'poor', 'terrible', 'hate', 'dislike', 'unhelpful', 'useless'];

      const lowercaseFeedback = feedbackText.toLowerCase();

      let positiveCount = 0;
      let negativeCount = 0;

      positiveKeywords.forEach(keyword => {
        if (lowercaseFeedback.includes(keyword)) positiveCount++;
      });

      negativeKeywords.forEach(keyword => {
        if (lowercaseFeedback.includes(keyword)) negativeCount++;
      });

      if (positiveCount > 0 && negativeCount > 0) {
        analysis.sentiment = 'MIXED';
      } else if (positiveCount > 0) {
        analysis.sentiment = 'POSITIVE';
      } else if (negativeCount > 0) {
        analysis.sentiment = 'NEGATIVE';
      }

      // Generate a simple response based on sentiment
      switch (analysis.sentiment) {
        case 'POSITIVE':
          response = "Thank you for your positive feedback! We're glad to hear you're enjoying your experience with our platform.";
          break;
        case 'NEGATIVE':
          response = "Thank you for your feedback. We're sorry to hear about your concerns. We take all feedback seriously and will work on addressing these issues.";
          break;
        case 'MIXED':
          response = "Thank you for your feedback. We appreciate your balanced perspective and will work on addressing the concerns you've raised.";
          break;
        default:
          response = "Thank you for your feedback. We value your input and will use it to continue improving our platform.";
      }
    }

    // Create new feedback entry
    const feedback = await Feedback.create({
      user: userId,
      text: feedbackText,
      sentiment: analysis.sentiment,
      topics: analysis.topics,
      keyIssues: analysis.keyIssues,
      suggestions: analysis.suggestions,
      praise: analysis.praise,
      urgency: analysis.urgency,
      response,
      suggestedActions,
      llmEnhanced
    });

    // Return result
    return {
      userId,
      feedbackId: feedback._id.toString(),
      analysis,
      response,
      suggestedActions,
      llmEnhanced
    };
  } catch (error) {
    console.error('Error processing feedback:', error);
    throw error;
  }
}

/**
 * Get feedback history for a user
 * @param userId User ID
 * @returns Feedback history
 */
export async function getFeedbackHistory(userId: string): Promise<any[]> {
  await dbConnect();

  try {
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Get feedback history
    const feedback = await Feedback.find({ user: userId })
      .sort({ createdAt: -1 });

    return feedback.map(f => ({
      id: f._id.toString(),
      text: f.text,
      sentiment: f.sentiment,
      topics: f.topics,
      keyIssues: f.keyIssues,
      suggestions: f.suggestions,
      praise: f.praise,
      urgency: f.urgency,
      response: f.response,
      suggestedActions: f.suggestedActions,
      llmEnhanced: f.llmEnhanced,
      createdAt: f.createdAt
    }));
  } catch (error) {
    console.error('Error getting feedback history:', error);
    throw error;
  }
}
