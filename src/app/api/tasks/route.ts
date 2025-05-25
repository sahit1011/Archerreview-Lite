import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task, StudyPlan, Topic } from '@/models';

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.planId || !body.title || !body.type || !body.startTime || !body.endTime || !body.topicId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: planId, title, type, startTime, endTime, topicId'
        },
        { status: 400 }
      );
    }

    // Check if study plan exists
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

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create task',
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

    // Get query params
    const planId = request.nextUrl.searchParams.get('planId');
    const userId = request.nextUrl.searchParams.get('userId');
    const date = request.nextUrl.searchParams.get('date');
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');
    const taskType = request.nextUrl.searchParams.get('type');

    // Check for metadata filters
    const isRemediation = request.nextUrl.searchParams.get('metadata.isRemediation');

    // Build the query object
    let query: any = {};

    // If userId is provided, find the user's study plan first
    if (userId && userId !== 'undefined' && userId !== 'null') {
      try {
        // Find study plan for this user
        const studyPlan = await StudyPlan.findOne({ user: userId });
        if (studyPlan) {
          query.plan = studyPlan._id;
        } else {
          // If no study plan found, return empty array
          return NextResponse.json({
            success: true,
            tasks: []
          });
        }
      } catch (error) {
        console.error('Error finding study plan:', error);
        // Return empty array on error
        return NextResponse.json({
          success: true,
          tasks: []
        });
      }
    }

    // If planId is provided, use it directly
    if (planId) {
      query.plan = planId;
    }

    // If no plan identifier is available, return empty array
    if (!query.plan) {
      return NextResponse.json({
        success: true,
        tasks: []
      });
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

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch tasks',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
