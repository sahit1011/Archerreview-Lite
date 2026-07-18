import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task, Performance, StudyPlan } from '@/models';
import { calculateReadinessScore } from '@/lib/dbUtils';
import { requireAuth } from '@/lib/api-auth';
import { runAdaptivityLoop } from '@/services/adaptivityLoop';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request; userId is token-derived and trusted.
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const authUserId = auth.user.id;
    const { id } = await params;

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

    // Load the existing task first to verify ownership before mutating it.
    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          message: 'Task not found'
        },
        { status: 404 }
      );
    }

    // Ownership check: the task's plan must belong to the authenticated user
    const ownerPlan = await StudyPlan.findById(existingTask.plan);
    if (!ownerPlan || ownerPlan.user.toString() !== authUserId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden'
        },
        { status: 403 }
      );
    }

    // Update task now that ownership is confirmed
    const task = await Task.findByIdAndUpdate(
      id,
      { status: body.status },
      { new: true }
    ).populate({
      path: 'plan',
      populate: {
        path: 'user'
      }
    }).populate('topic');

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
    // Use the trusted, token-derived user id (ownership already verified above).
    const userId = authUserId;

    if (userId) {
      try {
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
        try {
          console.log('Calculating readiness score for user:', userId);
          readinessScore = await calculateReadinessScore(userId);
          console.log('New readiness score:', readinessScore ? readinessScore.overallScore : 'Not calculated');
        } catch (scoreError) {
          console.error('Error calculating readiness score:', scoreError);
          // Continue even if readiness score calculation fails
        }
      } catch (error) {
        console.error('Error handling task status change:', error);
        // Continue even if there's an error with performance records
      }
    } else {
      console.warn('Could not determine user ID for task:', task._id);
    }

    // Completing OR skipping/missing a task is a plan-affecting student event —
    // run the adaptive loop so the plan rebalances immediately (not only on the
    // scheduled/cron pass). Kept awaited so the UI can surface what changed
    // ("Plan rebalanced · rescheduled 2 tasks"), which showcases the live engine.
    let adaptation = null;
    if ((body.status === 'COMPLETED' || body.status === 'SKIPPED') && userId) {
      adaptation = await runAdaptivityLoop(userId);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Task status updated successfully',
      task,
      readinessScore,
      adaptation
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
