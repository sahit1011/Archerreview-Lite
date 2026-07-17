import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Conversation } from '@/models';
import { requireAuth } from '@/lib/api-auth';

/**
 * API endpoint for getting all conversations for the authenticated user
 * GET /api/conversations
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate: userId is derived from the verified token, never the client
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Get conversations for the authenticated user only
    const conversations = await Conversation.find({ user: userId })
      .sort({ timestamp: -1 });

    return NextResponse.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch conversations',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for creating a new conversation
 * POST /api/conversations
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
    if (!body.id || !body.title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: id, title'
        },
        { status: 400 }
      );
    }

    // Set default values for optional fields
    const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

    // Create conversation object (owned by the authenticated user)
    const conversationData = {
      id: body.id,
      user: userId,
      title: body.title,
      lastMessage: body.lastMessage || '',
      timestamp: timestamp,
      messages: body.messages || []
    };

    // Create new conversation
    const conversation = new Conversation(conversationData);

    // Save conversation to database
    await conversation.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Conversation created successfully',
      conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create conversation',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
