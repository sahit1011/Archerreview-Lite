import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Content, Topic } from '@/models';
import { requireAuth, requireAdmin } from '@/lib/api-auth';

/**
 * API endpoint for managing a specific content item
 * GET /api/content/[id] - Get content by ID
 * PUT /api/content/[id] - Update content
 * DELETE /api/content/[id] - Delete content
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require an authenticated user (study content is shared, not per-user scoped)
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const { id } = await params;

    // Connect to the database
    await dbConnect();

    // Find content by ID
    const content = await Content.findById(id).populate('topic');

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Updating shared study content requires admin privileges
    const auth = requireAdmin(request);
    if (auth.response) return auth.response;
    const { id } = await params;

    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Check if content exists
    const existingContent = await Content.findById(id);
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
    }

    // Update content
    const updatedContent = await Content.findByIdAndUpdate(
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
    ).populate('topic');

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Deleting shared study content requires admin privileges
    const auth = requireAdmin(request);
    if (auth.response) return auth.response;
    const { id } = await params;

    // Connect to the database
    await dbConnect();

    // Find and delete content
    const deletedContent = await Content.findByIdAndDelete(id);

    // Check if content exists
    if (!deletedContent) {
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
