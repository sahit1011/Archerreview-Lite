import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task, StudyPlan, Topic } from '@/models';
import { requireAuth } from '@/lib/api-auth';
import { parseBody, errorResponse, dateString, nonEmptyString, z } from '@/lib/validation';

const createTaskSchema = z.object({
  planId: nonEmptyString,
  title: nonEmptyString,
  type: nonEmptyString,
  startTime: dateString,
  endTime: dateString,
  topicId: nonEmptyString,
  description: z.string().optional(),
  status: z.string().optional(),
  contentId: z.string().optional(),
  difficulty: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request; userId is token-derived and trusted.
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Validate request body
    const parsed = await parseBody(request, createTaskSchema);
    if (parsed.response) return parsed.response;
    const body = parsed.data;

    // Check if study plan exists and belongs to the authenticated user
    const studyPlan = await StudyPlan.findById(body.planId);
    if (!studyPlan) {
      return NextResponse.json(
        {
          success: false,
          message: 'Study plan not found'
        },
        { status: 404 }
      );
    }

    // Ownership check: the plan must belong to the authenticated user
    if (studyPlan.user.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden'
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

    // Calculate duration in minutes
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Create task
    const task = new Task({
      plan: body.planId,
      title: body.title,
      description: body.description || '',
      type: body.type,
      status: body.status || 'PENDING',
      startTime,
      endTime,
      duration: durationMinutes,
      content: body.contentId,
      topic: body.topicId,
      difficulty: body.difficulty || 'MEDIUM'
    });

    // Save task to database
    await task.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Error creating task:', error);

    // Return a generic error response (do not leak error.message to clients)
    return errorResponse('Failed to create task', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request; userId is token-derived and trusted.
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Get query params
    const planId = request.nextUrl.searchParams.get('planId');
    const date = request.nextUrl.searchParams.get('date');
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');
    const taskType = request.nextUrl.searchParams.get('type');

    // Check for metadata filters
    const isRemediation = request.nextUrl.searchParams.get('metadata.isRemediation');

    // Build the query object
    let query: any = {};

    // Resolve the authenticated user's study plan and scope all tasks to it.
    let userStudyPlan;
    try {
      userStudyPlan = await StudyPlan.findOne({ user: userId });
    } catch (error) {
      console.error('Error finding study plan:', error);
      // Return empty array on error
      return NextResponse.json({
        success: true,
        tasks: []
      });
    }

    if (!userStudyPlan) {
      // If no study plan found, return empty array
      return NextResponse.json({
        success: true,
        tasks: []
      });
    }

    // Always scope to the authenticated user's own plan.
    query.plan = userStudyPlan._id;

    // If a planId is supplied, it must match the user's own plan; otherwise deny.
    if (planId && planId !== userStudyPlan._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden'
        },
        { status: 403 }
      );
    }

    // Add task type filter if provided
    if (taskType) {
      query.type = taskType;
    }

    // Add metadata filters if provided
    if (isRemediation === 'true') {
      query['metadata.isRemediation'] = true;
    }

    // If date range is provided, filter tasks for that range
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.startTime = { $gte: start, $lte: end };
    }
    // If single date is provided, filter tasks for that date
    else if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.startTime = { $gte: targetDate, $lt: nextDay };
    }

    // Execute the query
    const tasks = await Task.find(query)
      .populate('topic')
      .populate('content')
      .sort({ startTime: 1 });

    // Return success response
    return NextResponse.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);

    // Return a generic error response (do not leak error.message to clients)
    return errorResponse('Failed to fetch tasks', 500);
  }
}
