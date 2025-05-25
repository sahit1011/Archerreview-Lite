import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Conversation } from '@/models';

/**
 * API endpoint for getting a specific conversation
 * GET /api/conversations/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    // Get the conversation ID from params
    const id = await Promise.resolve(params.id);

    // Find conversation by ID
    const conversation = await Conversation.findOne({ id });

    // Check if conversation exists
    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          message: 'Conversation not found'
        },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch conversation',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for updating a specific conversation
 * PUT /api/conversations/:id
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Get the conversation ID from params
    const id = await Promise.resolve(params.id);

    // Find conversation by ID
    const conversation = await Conversation.findOne({ id });

    // Check if conversation exists
    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          message: 'Conversation not found'
        },
        { status: 404 }
      );
    }

    // Update conversation fields
    if (body.title) conversation.title = body.title;
    if (body.lastMessage) conversation.lastMessage = body.lastMessage;
    if (body.timestamp) conversation.timestamp = new Date(body.timestamp);
    if (body.messages) conversation.messages = body.messages;

    // Save updated conversation
    await conversation.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Conversation updated successfully',
      conversation
    });
  } catch (error) {
    console.error('Error updating conversation:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update conversation',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for deleting a specific conversation
 * DELETE /api/conversations/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    // Get the conversation ID from params
    const id = await Promise.resolve(params.id);

    // Find conversation by ID
    const conversation = await Conversation.findOne({ id });

    // Check if conversation exists
    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          message: 'Conversation not found'
        },
        { status: 404 }
      );
    }

    // Delete conversation
    await conversation.deleteOne();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete conversation',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
