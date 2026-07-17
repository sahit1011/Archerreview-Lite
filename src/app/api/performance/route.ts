import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Performance, Task, User, Topic, StudyPlan } from '@/models';
import { calculateReadinessScore } from '@/lib/dbUtils';
import { requireAuth } from '@/lib/api-auth';
import { parseBody, errorResponse, nonEmptyString, z } from '@/lib/validation';

const createPerformanceSchema = z.object({
  taskId: nonEmptyString,
  topicId: nonEmptyString,
  timeSpent: z.number(),
  completed: z.boolean(),
  confidence: z.union([z.number(), z.string()]).refine(
    (v) => (typeof v === 'number' ? !Number.isNaN(v) : v.trim().length > 0),
    { message: 'Required' }
  ),
  contentId: z.string().optional(),
  score: z.number().optional(),
  answers: z.array(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request and derive the trusted userId from the token
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Validate request body
    const parsed = await parseBody(request, createPerformanceSchema);
    if (parsed.response) return parsed.response;
    const body = parsed.data;

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

    // Verify the task belongs to the authenticated user (via its study plan)
    const taskPlan = await StudyPlan.findById(task.plan);
    if (!taskPlan || taskPlan.user.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden: task does not belong to this user'
        },
        { status: 403 }
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
      user: userId,
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
    const readinessScore = await calculateReadinessScore(userId);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Performance recorded successfully',
      performance,
      readinessScore
    });
  } catch (error) {
    console.error('Error recording performance:', error);

    // Return a generic error response (do not leak error.message to clients)
    return errorResponse('Failed to record performance', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request and derive the trusted userId from the token
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Get performances for the authenticated user
    const performances = await Performance.find({ user: userId })
      .populate('task')
      .populate('topic')
      .populate('content')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      performances
    });
  } catch (error) {
    console.error('Error fetching performances:', error);

    // Return a generic error response (do not leak error.message to clients)
    return errorResponse('Failed to fetch performances', 500);
  }
}
