import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task } from '@/models';

/**
 * PATCH /api/tasks/[id]/complete
 * Mark a task as completed
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    // Get task ID from URL params
    const taskId = params.id;

    // Validate task ID
    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Task ID is required'
        },
        { status: 400 }
      );
    }

    // Find the task
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

    // Update task status to completed
    task.status = 'COMPLETED';
    await task.save();

    // Gamification features have been removed

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Task marked as completed',
      task
    });
  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to complete task',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
