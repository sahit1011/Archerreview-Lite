import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task } from '@/models';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    // Access the id with await to fix Next.js warning
    const { id: taskId } = await Promise.resolve(context.params);

    // Find task by ID
    const task = await Task.findById(taskId)
      .populate('topic')
      .populate('content');

    // Check if task exists
    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: 'Task not found'
        },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Error fetching task:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch task',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Access the id with await to fix Next.js warning
    const { id: taskId } = await Promise.resolve(context.params);

    // Find task by ID
    const task = await Task.findById(taskId);

    // Check if task exists
    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: 'Task not found'
        },
        { status: 404 }
      );
    }

    // Update task fields
    if (body.title) task.title = body.title;
    if (body.description) task.description = body.description;
    if (body.type) task.type = body.type;
    if (body.status) task.status = body.status;

    // Always ensure original times are set
    // This is more robust than checking !task.originalStartTime because
    // MongoDB might return undefined for fields that don't exist
    if (body.startTime) {
      if (!task.originalStartTime || task.originalStartTime === undefined) {
        console.log(`Storing original startTime for task ${task._id}:`, task.startTime);
        task.originalStartTime = task.startTime;
      }
    }

    if (body.endTime) {
      if (!task.originalEndTime || task.originalEndTime === undefined) {
        console.log(`Storing original endTime for task ${task._id}:`, task.endTime);
        task.originalEndTime = task.endTime;
      }
    }

    // Log the task state
    console.log(`Task ${task._id} state:`, {
      originalStartTime: task.originalStartTime,
      originalEndTime: task.originalEndTime,
      currentStartTime: task.startTime,
      currentEndTime: task.endTime,
      newStartTime: body.startTime ? new Date(body.startTime) : undefined,
      newEndTime: body.endTime ? new Date(body.endTime) : undefined
    });

    // Update times
    if (body.startTime) task.startTime = new Date(body.startTime);
    if (body.endTime) task.endTime = new Date(body.endTime);

    // If both start and end time are provided, recalculate duration
    if (body.startTime && body.endTime) {
      const startTime = new Date(body.startTime);
      const endTime = new Date(body.endTime);
      task.duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    } else if (body.duration) {
      task.duration = body.duration;
    }

    if (body.content) task.content = body.content;
    if (body.topic) task.topic = body.topic;
    if (body.difficulty) task.difficulty = body.difficulty;
    if (body.confidence) task.confidence = body.confidence;

    // Save updated task
    await task.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Error updating task:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update task',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    // Access the id with await to fix Next.js warning
    const { id: taskId } = await Promise.resolve(context.params);

    // Find and delete task
    const task = await Task.findByIdAndDelete(taskId);

    // Check if task exists
    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: 'Task not found'
        },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete task',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
