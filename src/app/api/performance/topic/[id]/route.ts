import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Performance, Topic } from '@/models';
import { requireAuth } from '@/lib/api-auth';

/**
 * API endpoint for getting performance data for a specific topic
 * GET /api/performance/topic/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request and derive the trusted userId from the token
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Get the topic ID from the URL
    const { id: topicId } = await params;
    if (!topicId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Topic ID is required'
        },
        { status: 400 }
      );
    }

    // Check if topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json(
        {
          success: false,
          message: 'Topic not found'
        },
        { status: 404 }
      );
    }

    // Get performance data for this topic
    const performances = await Performance.find({
      user: userId,
      topic: topicId
    }).sort({ createdAt: -1 });

    // If no performance data exists, return empty performance
    if (performances.length === 0) {
      return NextResponse.json({
        success: true,
        performance: {
          averageScore: 0,
          confidenceLevel: 0,
          completedTasks: 0,
          lastActivity: null,
          weakAreas: []
        },
        topic: {
          id: topic._id,
          name: topic.name,
          category: topic.category,
          difficulty: topic.difficulty
        }
      });
    }

    // Calculate average score
    const scores = performances
      .filter(p => p.score !== undefined && p.score !== null)
      .map(p => p.score);

    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + (score || 0), 0) / scores.length)
      : null;

    // Calculate average confidence
    const avgConfidence = Math.round(
      (performances.reduce((sum, p) => sum + p.confidence, 0) / performances.length) * 10
    ) / 10;

    // Identify weak areas
    const weakAreas = [];

    // If average score is below 70%, add general understanding
    if (avgScore !== null && avgScore < 70) {
      weakAreas.push('General understanding');
    }

    // If average confidence is below 3, add confidence
    if (avgConfidence < 3) {
      weakAreas.push('Confidence in material');
    }

    // If there are quiz performances with low scores, analyze question types
    const quizPerformances = performances.filter(p =>
      (p as any).type === 'QUIZ' &&
      p.answers &&
      p.answers.length > 0
    );

    if (quizPerformances.length > 0) {
      // Analyze incorrect answers to identify specific weak areas
      const incorrectAnswers = quizPerformances.flatMap(p =>
        (p.answers || []).filter(a => !a.isCorrect)
      );

      if (incorrectAnswers.length > 0) {
        // In a real implementation, you would analyze the question types
        // For now, we'll just add a generic weak area if there are many incorrect answers
        if (incorrectAnswers.length > 5) {
          weakAreas.push('Application of concepts');
        }
      }
    }

    // Format the performance data
    const performanceData = {
      averageScore: avgScore,
      confidenceLevel: avgConfidence,
      completedTasks: performances.filter(p => p.completed).length,
      lastActivity: performances[0].createdAt,
      weakAreas,
      totalPerformances: performances.length,
      recentPerformances: performances.slice(0, 5).map(p => ({
        id: p._id,
        type: (p as any).type || 'UNKNOWN',
        score: p.score,
        confidence: p.confidence,
        timeSpent: p.timeSpent,
        completed: p.completed,
        date: p.createdAt
      }))
    };

    // Return success response
    return NextResponse.json({
      success: true,
      performance: performanceData,
      topic: {
        id: topic._id,
        name: topic.name,
        category: topic.category,
        difficulty: topic.difficulty
      }
    });
  } catch (error) {
    console.error('Error getting topic performance:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get topic performance',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
