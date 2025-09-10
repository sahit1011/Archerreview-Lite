import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Conversation, User } from '@/models';

/**
 * API endpoint for getting all conversations for a user
 * GET /api/conversations?userId=<userId>
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Get userId from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // If userId is provided, get conversations for that user
    if (userId) {
      // Check if user exists
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

      // Get conversations for user
      const conversations = await Conversation.find({ user: userId })
        .sort({ timestamp: -1 });

      return NextResponse.json({
        success: true,
        conversations
      });
    }

    // If no userId is provided, return guest conversations (no user field)
    const conversations = await Conversation.find({ user: { $exists: false } })
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

    // Check if user exists if userId is provided
    if (body.userId) {
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
    }

    // Create conversation object
    const conversationData = {
      id: body.id,
      user: body.userId || undefined,
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
