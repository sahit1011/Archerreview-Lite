import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, Task, Topic, Adaptation } from '@/models';

export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Get user ID from query params
    const userId = request.nextUrl.searchParams.get('userId');

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required query parameter: userId'
        },
        { status: 400 }
      );
    }

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

    // Get adaptations for the user
    const adaptations = await Adaptation.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('task')
      .populate('topic');

    // Format adaptations for response
    const formattedAdaptations = adaptations.map(adaptation => {
      const formattedAdaptation: any = {
        _id: adaptation._id,
        type: adaptation.type,
        description: adaptation.description,
        reason: adaptation.reason,
        date: adaptation.createdAt,
        metadata: adaptation.metadata || {}
      };

      // Add task details if available
      if (adaptation.task) {
        formattedAdaptation.taskId = adaptation.task._id;
        formattedAdaptation.taskTitle = adaptation.task.title;
      }

      // Add topic details if available
      if (adaptation.topic) {
        formattedAdaptation.topicId = adaptation.topic._id;
        formattedAdaptation.topicName = adaptation.topic.name;
      }

      return formattedAdaptation;
    });

    // Return success response
    return NextResponse.json({
      success: true,
      adaptations: formattedAdaptations
    });
  } catch (error) {
    console.error('Error fetching plan adaptations:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch plan adaptations',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.userId || !body.planId || !body.type || !body.description || !body.reason) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: userId, planId, type, description, reason'
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

    // Create adaptation record
    const adaptation = new Adaptation({
      user: body.userId,
      plan: body.planId,
      type: body.type,
      description: body.description,
      reason: body.reason,
      task: body.taskId,
      topic: body.topicId,
      metadata: body.metadata || {}
    });

    // Save adaptation to database
    await adaptation.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Adaptation recorded successfully',
      adaptation
    });
  } catch (error) {
    console.error('Error recording adaptation:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to record adaptation',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
