import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, Performance, Topic, Content, Note } from '@/models';
import { generateTopicTutorResponse } from '@/services/generativeAI';
import { formatAIResponse } from '@/utils/responseFormatter';
import { requireAuth } from '@/lib/api-auth';

/**
 * API endpoint for the Topic-Specific AI Tutor
 * POST /api/tutor/topic
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate: userId is derived from the verified token, never the client
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.message || !body.topicId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: message and topicId'
        },
        { status: 400 }
      );
    }

    // Load the authenticated user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    // Check if topic exists
    const topic = await Topic.findById(body.topicId);
    if (!topic) {
      return NextResponse.json(
        {
          success: false,
          message: 'Topic not found'
        },
        { status: 404 }
      );
    }

    // Get conversation history if provided
    const conversationHistory = body.history || [];

    // Get user's performance data for this topic
    let performanceData = null;
    if (user) {
      const performances = await Performance.find({
        user: user._id,
        topic: topic._id
      }).sort({ createdAt: -1 }).limit(10);

      if (performances.length > 0) {
        // Calculate average score
        const scores = performances.filter(p => p.score !== undefined).map(p => p.score);
        const avgScore = scores.length > 0 
          ? scores.reduce((sum, score) => sum + (score || 0), 0) / scores.length 
          : null;

        // Calculate average confidence
        const avgConfidence = performances.reduce((sum, p) => sum + p.confidence, 0) / performances.length;

        // Identify weak areas (if any)
        const weakAreas = [];
        if (avgScore !== null && avgScore < 70) {
          weakAreas.push('Overall topic understanding');
        }
        if (avgConfidence < 3) {
          weakAreas.push('Confidence in the material');
        }

        performanceData = {
          averageScore: avgScore,
          confidenceLevel: avgConfidence,
          completedTasks: performances.filter(p => p.completed).length,
          lastActivity: performances[0].createdAt,
          weakAreas
        };
      }
    }

    // Get related content for this topic
    const relatedContent = await Content.find({ topic: topic._id }).limit(3);

    // Extract content titles and types for context
    const contentContext = relatedContent.map(c => ({
      title: c.title,
      type: c.type,
      description: c.description.substring(0, 100) // Truncate for brevity
    }));

    // Session memory: the student's saved revision notes for this topic, so the
    // tutor builds on previous sessions instead of starting from scratch.
    let savedNotes: string | undefined;
    try {
      const notes = await Note.find({ user: userId, topic: topic._id })
        .sort({ updatedAt: -1 })
        .limit(3)
        .select('title content')
        .lean();
      if (notes.length > 0) {
        savedNotes = notes
          .map((n: any) => `### ${n.title}\n${n.content}`)
          .join('\n\n')
          .slice(0, 4000);
      }
    } catch (notesErr) {
      console.error('Error loading notes for tutor memory:', notesErr);
    }

    // Generate response using the Generative AI service with topic context
    const rawResponse = await generateTopicTutorResponse(
      body.message,
      {
        topicId: topic._id.toString(),
        topicName: topic.name,
        topicDescription: topic.description,
        topicCategory: topic.category,
        topicDifficulty: topic.difficulty,
        performance: performanceData,
        relatedContent: contentContext,
        savedNotes
      },
      userId,
      conversationHistory
    );

    // Format the response
    const formattedResponse = formatAIResponse(rawResponse);

    // Log the interaction for analytics
    await logTutorInteraction(userId, topic._id as string, body.message, formattedResponse);

    // Return success response
    return NextResponse.json({
      success: true,
      response: formattedResponse,
      topic: {
        id: topic._id,
        name: topic.name,
        category: topic.category
      }
    });
  } catch (error) {
    console.error('Error in Topic AI Tutor API:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process request',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Log tutor interaction for analytics
 */
async function logTutorInteraction(
  userId: string | undefined,
  topicId: string,
  userMessage: string,
  aiResponse: string
) {
  try {
    // In a real implementation, you would log this to a database
    // For now, we'll just log to console
    console.log('Tutor Interaction:', {
      userId,
      topicId,
      timestamp: new Date(),
      messageLength: userMessage.length,
      responseLength: aiResponse.length
    });
  } catch (error) {
    console.error('Error logging tutor interaction:', error);
  }
}
