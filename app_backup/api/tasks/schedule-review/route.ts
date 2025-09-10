import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, Topic, StudyPlan, Task, Alert } from '@/models';
import { addDays, addHours, startOfDay, endOfDay } from 'date-fns';

/**
 * API endpoint for scheduling a review session
 * POST /api/tasks/schedule-review
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

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

    // Determine the best time for the review session
    const scheduledTime = await findOptimalReviewTime(body.userId, studyPlan._id);

    // Create the review task
    const task = new Task({
      plan: studyPlan._id,
      title: `Review: ${topic.name}`,
      description: `Review session for ${topic.name} scheduled by the AI Tutor.`,
      type: 'REVIEW',
      status: 'PENDING',
      startTime: scheduledTime.startTime,
      endTime: scheduledTime.endTime,
      duration: scheduledTime.duration,
      topic: topic._id,
      difficulty: topic.difficulty,
      metadata: {
        source: body.source || 'AI_TUTOR',
        priority: 'HIGH',
        isRemediation: true
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
        suggestedAction: 'Complete the scheduled review session',
        taskId: task._id.toString(),
        source: body.source || 'AI_TUTOR'
      },
      isResolved: false
    });

    await alert.save();

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

    // Return error response
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

/**
 * Find the optimal time for a review session
 * @param userId User ID
 * @param planId Study plan ID
 * @returns Optimal time for the review session
 */
async function findOptimalReviewTime(userId: string, planId: string) {
  // Get user's existing tasks for the next 3 days
  const now = new Date();
  const threeDaysLater = addDays(now, 3);
  
  const existingTasks = await Task.find({
    plan: planId,
    startTime: { $gte: startOfDay(now), $lte: endOfDay(threeDaysLater) }
  }).sort({ startTime: 1 });

  // Default duration for review sessions: 30 minutes
  const reviewDuration = 30;
  
  // Try to find a slot tomorrow
  const tomorrow = addDays(now, 1);
  const tomorrowStart = startOfDay(tomorrow);
  
  // Default times to try (9 AM, 2 PM, 6 PM)
  const defaultTimes = [9, 14, 18];
  
  // Check each default time
  for (const hour of defaultTimes) {
    const potentialStartTime = new Date(tomorrowStart);
    potentialStartTime.setHours(hour, 0, 0, 0);
    
    // Skip if this time is in the past
    if (potentialStartTime < now) continue;
    
    const potentialEndTime = addHours(potentialStartTime, reviewDuration / 60);
    
    // Check if this time slot conflicts with existing tasks
    const hasConflict = existingTasks.some(task => {
      return (
        (potentialStartTime >= task.startTime && potentialStartTime < task.endTime) ||
        (potentialEndTime > task.startTime && potentialEndTime <= task.endTime) ||
        (potentialStartTime <= task.startTime && potentialEndTime >= task.endTime)
      );
    });
    
    if (!hasConflict) {
      return {
        startTime: potentialStartTime,
        endTime: potentialEndTime,
        duration: reviewDuration
      };
    }
  }
  
  // If no slot found tomorrow, try the day after
  const dayAfterTomorrow = addDays(now, 2);
  const dayAfterTomorrowStart = startOfDay(dayAfterTomorrow);
  
  for (const hour of defaultTimes) {
    const potentialStartTime = new Date(dayAfterTomorrowStart);
    potentialStartTime.setHours(hour, 0, 0, 0);
    
    const potentialEndTime = addHours(potentialStartTime, reviewDuration / 60);
    
    // Check if this time slot conflicts with existing tasks
    const hasConflict = existingTasks.some(task => {
      return (
        (potentialStartTime >= task.startTime && potentialStartTime < task.endTime) ||
        (potentialEndTime > task.startTime && potentialEndTime <= task.endTime) ||
        (potentialStartTime <= task.startTime && potentialEndTime >= task.endTime)
      );
    });
    
    if (!hasConflict) {
      return {
        startTime: potentialStartTime,
        endTime: potentialEndTime,
        duration: reviewDuration
      };
    }
  }
  
  // If still no slot found, use the first available 30-minute slot in the next 3 days
  // Start from 9 AM tomorrow and check every hour until 8 PM
  for (let day = 1; day <= 3; day++) {
    const checkDate = addDays(now, day);
    const checkDateStart = startOfDay(checkDate);
    
    for (let hour = 9; hour <= 20; hour++) {
      const potentialStartTime = new Date(checkDateStart);
      potentialStartTime.setHours(hour, 0, 0, 0);
      
      const potentialEndTime = addHours(potentialStartTime, reviewDuration / 60);
      
      // Check if this time slot conflicts with existing tasks
      const hasConflict = existingTasks.some(task => {
        return (
          (potentialStartTime >= task.startTime && potentialStartTime < task.endTime) ||
          (potentialEndTime > task.startTime && potentialEndTime <= task.endTime) ||
          (potentialStartTime <= task.startTime && potentialEndTime >= task.endTime)
        );
      });
      
      if (!hasConflict) {
        return {
          startTime: potentialStartTime,
          endTime: potentialEndTime,
          duration: reviewDuration
        };
      }
    }
  }
  
  // If all else fails, schedule for tomorrow at 9 AM
  const fallbackStartTime = new Date(tomorrowStart);
  fallbackStartTime.setHours(9, 0, 0, 0);
  
  return {
    startTime: fallbackStartTime,
    endTime: addHours(fallbackStartTime, reviewDuration / 60),
    duration: reviewDuration
  };
}
