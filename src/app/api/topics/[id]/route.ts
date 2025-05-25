import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Topic, Content } from '@/models';

/**
 * API endpoint for managing a specific topic
 * GET /api/topics/[id] - Get topic by ID
 * PUT /api/topics/[id] - Update topic
 * DELETE /api/topics/[id] - Delete topic
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    // Get the topic ID from params - use a different approach to avoid the warning
    const { id } = params;

    // Find topic by ID
    const topic = await Topic.findById(id).populate('prerequisites');

    // Check if topic exists
    if (!topic) {
      return NextResponse.json(
        {
          success: false,
          message: 'Topic not found'
        },
        { status: 404 }
      );
    }

    // Get related content
    const content = await Content.find({ topic: id }).sort({ createdAt: -1 });

    // Return success response
    return NextResponse.json({
      success: true,
      topic,
      content
    });
  } catch (error) {
    console.error('Error fetching topic:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch topic',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Check if topic exists
    const existingTopic = await Topic.findById(params.id);
    if (!existingTopic) {
      return NextResponse.json(
        {
          success: false,
          message: 'Topic not found'
        },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required field: name'
        },
        { status: 400 }
      );
    }

    // Check for duplicate topic name
    const duplicateTopic = await Topic.findOne({
      name: body.name,
      _id: { $ne: params.id }
    });

    if (duplicateTopic) {
      return NextResponse.json(
        {
          success: false,
          message: 'A topic with this name already exists'
        },
        { status: 400 }
      );
    }

    // Handle prerequisites
    if (body.prerequisites && Array.isArray(body.prerequisites)) {
      // Check for circular dependencies
      if (body.prerequisites.includes(params.id)) {
        return NextResponse.json(
          {
            success: false,
            message: 'A topic cannot be a prerequisite of itself'
          },
          { status: 400 }
        );
      }

      // Check if all prerequisites exist
      const prerequisiteCount = await Topic.countDocuments({
        _id: { $in: body.prerequisites }
      });

      if (prerequisiteCount !== body.prerequisites.length) {
        return NextResponse.json(
          {
            success: false,
            message: 'One or more prerequisites do not exist'
          },
          { status: 400 }
        );
      }

      // Check for circular dependencies in the prerequisite chain
      for (const prereqId of body.prerequisites) {
        const prereq = await Topic.findById(prereqId);
        if (prereq && prereq.prerequisites && prereq.prerequisites.length > 0) {
          if (prereq.prerequisites.includes(new mongoose.Types.ObjectId(params.id))) {
            return NextResponse.json(
              {
                success: false,
                message: `Circular dependency detected: ${prereq.name} already has this topic as a prerequisite`
              },
              { status: 400 }
            );
          }

          // Check for indirect circular dependencies
          const stack = [...prereq.prerequisites];
          const visited = new Set();

          while (stack.length > 0) {
            const currentId = stack.pop();
            if (visited.has(currentId.toString())) continue;
            visited.add(currentId.toString());

            if (currentId.toString() === params.id) {
              return NextResponse.json(
                {
                  success: false,
                  message: 'Circular dependency detected in the prerequisite chain'
                },
                { status: 400 }
              );
            }

            const current = await Topic.findById(currentId);
            if (current && current.prerequisites && current.prerequisites.length > 0) {
              stack.push(...current.prerequisites);
            }
          }
        }
      }
    }

    // Update topic
    const updatedTopic = await Topic.findByIdAndUpdate(
      params.id,
      {
        name: body.name,
        description: body.description,
        difficulty: body.difficulty,
        prerequisites: body.prerequisites || []
      },
      { new: true }
    ).populate('prerequisites');

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Topic updated successfully',
      topic: updatedTopic
    });
  } catch (error) {
    console.error('Error updating topic:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update topic',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    // Check if topic is used as a prerequisite
    const topicsUsingAsPrereq = await Topic.countDocuments({
      prerequisites: params.id
    });

    if (topicsUsingAsPrereq > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot delete topic because it is used as a prerequisite for other topics'
        },
        { status: 400 }
      );
    }

    // Check if topic is used in content
    const contentUsingTopic = await Content.countDocuments({
      topic: params.id
    });

    if (contentUsingTopic > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot delete topic because it is used in content items'
        },
        { status: 400 }
      );
    }

    // Find and delete topic
    const deletedTopic = await Topic.findByIdAndDelete(params.id);

    // Check if topic exists
    if (!deletedTopic) {
      return NextResponse.json(
        {
          success: false,
          message: 'Topic not found'
        },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Topic deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting topic:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete topic',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
