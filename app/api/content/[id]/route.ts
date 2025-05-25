import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

/**
 * API endpoint for managing a specific content item
 * GET /api/content/[id] - Get content by ID
 * PUT /api/content/[id] - Update content
 * DELETE /api/content/[id] - Delete content
 */

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    // Get params
    const { id } = context.params;

    // Use mongoose model directly
    const ContentModel = mongoose.model('Content');

    // Find content by ID
    const content = await ContentModel.findById(id).lean().populate('topic');

    // Check if content exists
    if (!content) {
      return NextResponse.json(
        {
          success: false,
          message: 'Content not found'
        },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Error fetching content:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch content',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    // Get params
    const { id } = context.params;

    // Parse request body
    const body = await request.json();

    // Use mongoose models directly
    const ContentModel = mongoose.model('Content');
    const TopicModel = mongoose.model('Topic');

    // Check if content exists
    const existingContent = await ContentModel.findById(id);
    if (!existingContent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Content not found'
        },
        { status: 404 }
      );
    }

    // Check if topic exists if topicId is provided
    if (body.topicId) {
      const topic = await TopicModel.findById(body.topicId).lean();
      if (!topic) {
        return NextResponse.json(
          {
            success: false,
            message: 'Topic not found'
          },
          { status: 404 }
        );
      }
    }

    // Update content
    const updatedContent = await ContentModel.findByIdAndUpdate(
      id,
      {
        title: body.title,
        description: body.description,
        type: body.type,
        topic: body.topicId || existingContent.topic,
        duration: body.duration,
        difficulty: body.difficulty,
        url: body.url,
        content: body.content,
        questions: body.questions
      },
      { new: true }
    ).lean().populate('topic');

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Content updated successfully',
      content: updatedContent
    });
  } catch (error) {
    console.error('Error updating content:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update content',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    // Get params
    const { id } = context.params;

    // Use mongoose model directly
    const ContentModel = mongoose.model('Content');

    // Delete the content
    const result = await ContentModel.deleteOne({ _id: id });

    // Check if any document was deleted
    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Content not found'
        },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete content',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
