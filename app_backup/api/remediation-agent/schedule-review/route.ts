import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, StudyPlan, Task, Alert, Topic } from '@/models';
import { findOptimalReviewTime } from '@/services/schedulerUtils';
import { trackRemediationEffectiveness, RemediationActionType } from '@/services/remediationAgent';

/**
 * API endpoint for scheduling a review session
 * POST /api/remediation-agent/schedule-review
 */
export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.userId || !body.topicId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: userId and topicId'
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findById(body.userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
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

    // Check if there's already a scheduled review for this topic
    const existingReviews = await Task.find({
      plan: studyPlan._id,
      topic: body.topicId,
      type: 'REVIEW',
      status: 'PENDING',
      startTime: { $gte: new Date() },
      'metadata.isRemediation': true
    });

    // If there's already a scheduled review for this topic, return it
    if (existingReviews.length > 0) {
      const existingReview = existingReviews[0];

      // Update the alert if provided
      if (body.alertId) {
        await Alert.findByIdAndUpdate(body.alertId, {
          $set: {
            'metadata.scheduledTaskId': existingReview._id.toString(),
            'metadata.suggestedAction': `Complete the scheduled review session on ${existingReview.startTime.toLocaleDateString()} at ${existingReview.startTime.toLocaleTimeString()}`
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Review session already scheduled for this topic',
        task: {
          id: existingReview._id,
          title: existingReview.title,
          startTime: existingReview.startTime,
          endTime: existingReview.endTime,
          duration: existingReview.duration
        },
        isExisting: true
      });
    }

    // Determine the best time for the review session
    const scheduledTime = await findOptimalReviewTime(body.userId, studyPlan._id.toString());

    // Create the review task
    const task = new Task({
      plan: studyPlan._id,
      title: `Review: ${topic.name}`,
      description: `Review session for ${topic.name} scheduled by the Remediation Agent.`,
      type: 'REVIEW',
      status: 'PENDING',
      startTime: scheduledTime.startTime,
      endTime: scheduledTime.endTime,
      duration: scheduledTime.duration,
      topic: topic._id,
      difficulty: topic.difficulty || 'MEDIUM',
      metadata: {
        source: body.source || 'REMEDIATION_AGENT',
        priority: 'HIGH',
        isRemediation: true,
        relatedAlertId: body.alertId
      }
    });

    await task.save();

    // Create an alert for the user
    const alert = new Alert({
      user: body.userId,
      plan: studyPlan._id,
      type: 'REMEDIATION',
      severity: 'MEDIUM',
      message: `A review session for ${topic.name} has been scheduled on ${scheduledTime.startTime.toLocaleDateString()} at ${scheduledTime.startTime.toLocaleTimeString()}.`,
      relatedTask: task._id,
      relatedTopic: topic._id,
      metadata: {
        remediationType: 'CONCEPT_REVIEW',
        title: `Review Session Scheduled: ${topic.name}`,
        suggestedAction: `Complete the scheduled review session on ${scheduledTime.startTime.toLocaleDateString()} at ${scheduledTime.startTime.toLocaleTimeString()}`,
        taskId: task._id.toString(),
        source: body.source || 'REMEDIATION_AGENT'
      },
      isResolved: false
    });

    await alert.save();

    // If there's an existing alert that triggered this review, update it
    if (body.alertId) {
      await Alert.findByIdAndUpdate(body.alertId, {
        $set: {
          'metadata.scheduledTaskId': task._id.toString(),
          'metadata.suggestedAction': `Complete the scheduled review session on ${scheduledTime.startTime.toLocaleDateString()} at ${scheduledTime.startTime.toLocaleTimeString()}`
        }
      });
    }

    // Track the effectiveness of this action
    await trackRemediationEffectiveness(
      body.userId,
      RemediationActionType.SCHEDULE_REVIEW,
      body.topicId,
      {
        taskId: task._id.toString(),
        startTime: scheduledTime.startTime,
        endTime: scheduledTime.endTime,
        duration: scheduledTime.duration,
        source: body.source || 'API'
      }
    );

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Review session scheduled successfully',
      task: {
        id: task._id,
        title: task.title,
        startTime: task.startTime,
        endTime: task.endTime,
        duration: task.duration
      }
    });
  } catch (error) {
    console.error('Error scheduling review session:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to schedule review session',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
