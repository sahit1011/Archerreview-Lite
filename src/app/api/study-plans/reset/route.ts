import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { StudyPlan, Task } from '@/models';

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

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

    // Find the user's study plan
    const studyPlan = await StudyPlan.findOne({ user: body.userId });

    if (!studyPlan) {
      return NextResponse.json(
        {
          success: false,
          message: 'No study plan found for this user'
        },
        { status: 404 }
      );
    }

    // Find all tasks for this plan
    const tasks = await Task.find({ plan: studyPlan._id });

    // Log tasks before reset
    console.log(`Found ${tasks.length} tasks to reset`);

    // Get the original task data
    const originalTasks = tasks.map(task => {
      console.log(`Task ${task._id}:`, {
        current: { startTime: task.startTime, endTime: task.endTime },
        original: { startTime: task.originalStartTime, endTime: task.originalEndTime }
      });

      // Check if we have original times
      const hasOriginalStartTime = task.originalStartTime && task.originalStartTime !== undefined;
      const hasOriginalEndTime = task.originalEndTime && task.originalEndTime !== undefined;

      // If we don't have original times, we'll use the current times
      // This means the task hasn't been moved yet
      return {
        _id: task._id,
        originalStartTime: hasOriginalStartTime ? task.originalStartTime : task.startTime,
        originalEndTime: hasOriginalEndTime ? task.originalEndTime : task.endTime,
        status: 'PENDING'
      };
    });

    // Update each task with its original data
    const updatePromises = originalTasks.map(originalTask => {
      console.log(`Resetting task ${originalTask._id} to:`, {
        startTime: originalTask.originalStartTime,
        endTime: originalTask.originalEndTime
      });

      return Task.findByIdAndUpdate(
        originalTask._id,
        {
          startTime: originalTask.originalStartTime,
          endTime: originalTask.originalEndTime,
          status: originalTask.status
        },
        { new: true }
      );
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Schedule reset successfully'
    });
  } catch (error) {
    console.error('Error resetting schedule:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to reset schedule',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
