import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Content, Topic } from '@/models';
import { type NextRouteContext } from 'next/dist/server/future/route-modules/app-route/module';

/**
 * API endpoint for managing a specific content item
 * GET /api/content/[id] - Get content by ID
 * PUT /api/content/[id] - Update content
 * DELETE /api/content/[id] - Delete content
 */

export async function GET(
  request: NextRequest,
  { params }: NextRouteContext<{ id: string }>
) {
  try {
    // Connect to the database
    await dbConnect();

    // Find content by ID
    const content = await Content.findById(params.id).populate('topic');

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
  { params }: NextRouteContext<{ id: string }>
) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Check if content exists
    const existingContent = await Content.findById(params.id);
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
      params.id,
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
  { params }: NextRouteContext<{ id: string }>
) {
  try {
    // Connect to the database
    await dbConnect();

    // Find and delete content
    const deletedContent = await Content.findByIdAndDelete(params.id);

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
