import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task, Performance } from '@/models';
import { calculateReadinessScore } from '@/lib/dbUtils';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required field: status'
        },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Get the task ID from params
    const { id } = await params;

    // Find and update task
    const task = await Task.findByIdAndUpdate(
      id,
      { status: body.status },
      { new: true }
    ).populate('plan').populate('topic');

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

    let readinessScore = null;

    if (task.plan && task.plan.user) {
      try {
        // Get the user ID from the task's plan
        const userId = task.plan.user.toString();

        // If task is marked as completed, create performance record
        if (body.status === 'COMPLETED') {
          // Create a performance record for this task
          // Assign a default score to all tasks, not just quizzes
          const defaultScore = task.type === 'QUIZ' ? 75 : 70; // Default score for all tasks
          const defaultConfidence = 3; // Medium confidence
          const defaultTimeSpent = task.duration || 30; // Use task duration or default to 30 minutes

          // Create and save the performance record
          const performance = new Performance({
            user: userId,
            task: task._id,
            topic: task.topic._id,
            score: defaultScore,
            timeSpent: defaultTimeSpent,
            completed: true,
            confidence: defaultConfidence
          });

          await performance.save();
          console.log('Created performance record for completed task:', task._id);
        }
        // If task is marked as pending, delete any associated performance records
        else if (body.status === 'PENDING') {
          // Find and delete performance records for this task
          const deletedRecords = await Performance.deleteMany({ task: task._id });
          if (deletedRecords.deletedCount > 0) {
            console.log(`Deleted ${deletedRecords.deletedCount} performance records for task:`, task._id);
          }
        }

        // Calculate and update readiness score for both completed and pending status changes
        console.log('Calculating readiness score for user:', userId);
        readinessScore = await calculateReadinessScore(userId);
        console.log('New readiness score:', readinessScore ? readinessScore.overallScore : 'Not calculated');
      } catch (error) {
        console.error('Error handling task status change:', error);
        // Continue even if there's an error
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Task status updated successfully',
      task,
      readinessScore
    });
  } catch (error) {
    console.error('Error updating task status:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update task status',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
