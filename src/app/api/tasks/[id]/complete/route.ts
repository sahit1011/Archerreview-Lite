import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task, StudyPlan } from '@/models';
import { requireAuth } from '@/lib/api-auth';
import { runAdaptivityLoop } from '@/services/adaptivityLoop';

/**
 * PATCH /api/tasks/[id]/complete
 * Mark a task as completed
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request; userId is token-derived and trusted.
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Get task ID from URL params
    const { id: taskId } = await params;

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

    // Ownership check: the task's plan must belong to the authenticated user
    const studyPlan = await StudyPlan.findById(task.plan);
    if (!studyPlan || studyPlan.user.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden'
        },
        { status: 403 }
      );
    }

    // Update task status to completed
    task.status = 'COMPLETED';
    await task.save();

    // Adaptive loop: completing a task triggers monitor -> adaptation -> remediation so the plan
    // visibly rebalances (the product's core differentiator, previously never invoked here).
    const adaptation = await runAdaptivityLoop(userId);

    // Return success response, including what the AI changed so the UI can surface it
    return NextResponse.json({
      success: true,
      message: 'Task marked as completed',
      task,
      adaptation
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
