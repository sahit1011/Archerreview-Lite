import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Performance, Task, User, Topic } from '@/models';
import { calculateReadinessScore } from '@/lib/dbUtils';

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId || !body.taskId || !body.topicId || !body.timeSpent || body.completed === undefined || !body.confidence) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: userId, taskId, topicId, timeSpent, completed, confidence' 
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
    
    // Check if task exists
    const task = await Task.findById(body.taskId);
    if (!task) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Task not found' 
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
    
    // Create performance record
    const performance = new Performance({
      user: body.userId,
      task: body.taskId,
      content: body.contentId,
      topic: body.topicId,
      score: body.score,
      timeSpent: body.timeSpent,
      completed: body.completed,
      confidence: body.confidence,
      answers: body.answers || []
    });
    
    // Save performance to database
    await performance.save();
    
    // Update task status if completed
    if (body.completed) {
      task.status = 'COMPLETED';
      await task.save();
    }
    
    // Calculate and update readiness score
    const readinessScore = await calculateReadinessScore(body.userId);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Performance recorded successfully',
      performance,
      readinessScore
    });
  } catch (error) {
    console.error('Error recording performance:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to record performance',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Get user ID from query params
    const userId = request.nextUrl.searchParams.get('userId');
    
    // If userId is provided, get performances for that user
    if (userId) {
      const performances = await Performance.find({ user: userId })
        .populate('task')
        .populate('topic')
        .populate('content')
        .sort({ createdAt: -1 });
      
      return NextResponse.json({ 
        success: true, 
        performances
      });
    }
    
    // Otherwise, return error (for security, don't allow fetching all performances)
    return NextResponse.json(
      { 
        success: false, 
        message: 'User ID is required' 
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching performances:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch performances',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
