import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, Task, Topic, Adaptation } from '@/models';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request and derive the trusted userId from the token
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

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
    
    // Get adaptations for the user (optionally capped via ?limit= for dashboard feeds)
    const limitParam = parseInt(request.nextUrl.searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 100;
    const adaptations = await Adaptation.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('task')
      .populate('topic');
    
    // Format adaptations for response
    const formattedAdaptations = adaptations.map(adaptation => {
      const formattedAdaptation: {
        _id: unknown;
        type: string;
        description: string;
        reason: string;
        date: Date;
        metadata: Record<string, any>;
        taskId?: unknown;
        taskTitle?: string;
        topicId?: unknown;
        topicName?: string;
      } = {
        _id: adaptation._id,
        type: adaptation.type,
        description: adaptation.description,
        reason: adaptation.reason,
        date: adaptation.createdAt,
        metadata: adaptation.metadata || {}
      };

      // Add task details if available
      if (adaptation.task) {
        const task = adaptation.task as any;
        formattedAdaptation.taskId = task._id;
        formattedAdaptation.taskTitle = task.title;
      }

      // Add topic details if available
      if (adaptation.topic) {
        const topic = adaptation.topic as any;
        formattedAdaptation.topicId = topic._id;
        formattedAdaptation.topicName = topic.name;
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
    // Authenticate the request and derive the trusted userId from the token
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.planId || !body.type || !body.description || !body.reason) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: planId, type, description, reason'
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

    // Create adaptation record
    const adaptation = new Adaptation({
      user: userId,
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
