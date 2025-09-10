import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, Topic, Performance } from '@/models';
import mongoose from 'mongoose';

/**
 * API endpoint for tracking AI Tutor sessions
 * POST /api/tutor/sessions
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.userId || !body.topicId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: userId and topicId'
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findById(body.userId);
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

    // Create a performance record for the tutor session
    const performance = new Performance({
      user: body.userId,
      topic: body.topicId,
      timeSpent: body.duration || 10, // Default to 10 minutes if not provided
      completed: body.completed || true,
      confidence: body.confidence || 3, // Default to medium confidence
      type: 'TUTOR_SESSION',
      metadata: {
        messageCount: body.messageCount || 0,
        source: body.source || 'AI_TUTOR',
        sessionId: new mongoose.Types.ObjectId(),
        timestamp: new Date()
      }
    });

    await performance.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Tutor session recorded successfully',
      sessionId: performance.metadata.sessionId
    });
  } catch (error) {
    console.error('Error recording tutor session:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to record tutor session',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for retrieving AI Tutor sessions
 * GET /api/tutor/sessions
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Get user ID from query params
    const userId = request.nextUrl.searchParams.get('userId');
    const topicId = request.nextUrl.searchParams.get('topicId');

    // Validate required fields
    if (!userId || userId === 'undefined' || userId === 'null') {
      return NextResponse.json(
        {
          success: true,
          sessions: [] // Return empty array instead of error for better UX
        }
      );
    }

    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: true,
          sessions: [] // Return empty array for invalid ObjectId
        }
      );
    }

    // Build query
    const query: any = {
      user: userId,
      type: 'TUTOR_SESSION'
    };

    // Add topic filter if provided
    if (topicId) {
      query.topic = topicId;
    }

    // Get tutor sessions
    const sessions = await Performance.find(query)
      .populate('topic')
      .sort({ createdAt: -1 })
      .limit(20);

    // Format sessions for response
    const formattedSessions = sessions.map(session => ({
      id: session._id,
      topicId: session.topic._id,
      topicName: session.topic.name,
      duration: session.timeSpent,
      completed: session.completed,
      confidence: session.confidence,
      messageCount: session.metadata?.messageCount || 0,
      timestamp: session.createdAt
    }));

    // Return success response
    return NextResponse.json({
      success: true,
      sessions: formattedSessions
    });
  } catch (error) {
    console.error('Error retrieving tutor sessions:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve tutor sessions',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
