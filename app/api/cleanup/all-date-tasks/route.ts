import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task, StudyPlan, Alert } from '@/models';

/**
 * API endpoint for cleaning up all tasks for a specific date
 * POST /api/cleanup/all-date-tasks
 */
export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required field: userId'
        },
        { status: 400 }
      );
    }

    // Get user's study plan
    const studyPlan = await StudyPlan.findOne({ user: body.userId });
    if (!studyPlan) {
      return NextResponse.json(
        {
          success: false,
          message: 'Study plan not found'
        },
        { status: 404 }
      );
    }

    // Parse the target date
    const date = new Date(body.date);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Build query for tasks
    const query: any = {
      plan: studyPlan._id,
    };

    // Add date filter if provided
    if (body.date) {
      query.startTime = { $gte: date, $lt: nextDay };
    }

    // Add type filter if provided
    if (body.type) {
      query.type = body.type;
    }

    // Add remediation filter
    if (body.onlyRemediation !== false) {
      query['metadata.isRemediation'] = true; // Only delete remediation tasks by default
    }

    // Get tasks based on query
    const tasks = await Task.find(query);

    // Delete all tasks
    const deletedTaskIds = [];

    for (const task of tasks) {
      await Task.findByIdAndDelete(task._id);
      deletedTaskIds.push(task._id.toString());
    }

    // Update alerts that reference deleted tasks
    for (const taskId of deletedTaskIds) {
      const alerts = await Alert.find({
        'metadata.scheduledTaskId': taskId
      });

      for (const alert of alerts) {
        // Mark the alert as resolved
        alert.isResolved = true;
        alert.resolvedAt = new Date();

        await alert.save();
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: body.date
        ? `Cleaned up ${tasks.length} tasks for ${body.date}`
        : `Cleaned up ${tasks.length} tasks across all dates`,
      deletedTasks: tasks.map(task => ({
        id: task._id,
        title: task.title,
        startTime: task.startTime
      }))
    });
  } catch (error) {
    console.error('Error cleaning up date tasks:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clean up date tasks',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
