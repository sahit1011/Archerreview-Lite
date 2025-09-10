import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task, StudyPlan, Alert } from '@/models';

/**
 * API endpoint for cleaning up tasks scheduled at the same time
 * POST /api/cleanup/duplicate-time-tasks
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

    // Get optional parameters
    const targetHour = body.hour !== undefined ? parseInt(body.hour) : null; // If null, will process all hours
    const targetDate = body.date || '2025-05-09'; // Default to May 9, 2025

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
    const date = new Date(targetDate);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all tasks for the specified date
    const tasks = await Task.find({
      plan: studyPlan._id,
      startTime: { $gte: date, $lt: nextDay }
    }).populate('topic');

    // Group tasks by start hour
    const tasksByHour = new Map();

    for (const task of tasks) {
      const hour = task.startTime.getHours();

      // If targetHour is null, process all hours, otherwise only the target hour
      if (targetHour === null || hour === targetHour) {
        if (!tasksByHour.has(hour)) {
          tasksByHour.set(hour, []);
        }

        tasksByHour.get(hour).push(task);
      }
    }

    // Find duplicate tasks at the target hour
    const duplicateTasks = [];

    for (const [hour, hourTasks] of tasksByHour.entries()) {
      if (hourTasks.length > 1) {
        // Group by topic
        const tasksByTopic = new Map();

        for (const task of hourTasks) {
          if (!task.topic) continue;

          const topicId = task.topic._id.toString();

          if (!tasksByTopic.has(topicId)) {
            tasksByTopic.set(topicId, []);
          }

          tasksByTopic.get(topicId).push(task);
        }

        // For each topic, keep only one task
        for (const [topicId, topicTasks] of tasksByTopic.entries()) {
          if (topicTasks.length > 1) {
            // Keep the first task, remove the rest
            const taskToKeep = topicTasks[0];

            // Add the rest to the list of duplicates to remove
            for (let i = 1; i < topicTasks.length; i++) {
              duplicateTasks.push(topicTasks[i]);
            }
          }
        }
      }
    }

    // Delete duplicate tasks
    const deletedTaskIds = [];

    for (const task of duplicateTasks) {
      await Task.findByIdAndDelete(task._id);
      deletedTaskIds.push(task._id.toString());
    }

    // Update alerts that reference deleted tasks
    for (const taskId of deletedTaskIds) {
      const alerts = await Alert.find({
        'metadata.scheduledTaskId': taskId
      });

      for (const alert of alerts) {
        // Find the task to keep for this topic
        const topicId = alert.relatedTopic?.toString();
        if (!topicId) continue;

        // Find a remaining task for this topic
        const remainingTask = await Task.findOne({
          plan: studyPlan._id,
          topic: topicId,
          _id: { $nin: deletedTaskIds }
        });

        if (remainingTask) {
          // Update the alert to reference the remaining task
          alert.metadata.scheduledTaskId = remainingTask._id.toString();
          alert.metadata.suggestedAction = `Complete the scheduled review session on ${remainingTask.startTime.toLocaleDateString()} at ${remainingTask.startTime.toLocaleTimeString()}`;

          await alert.save();
        } else {
          // If no remaining task, mark the alert as resolved
          alert.isResolved = true;
          alert.resolvedAt = new Date();

          await alert.save();
        }
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: targetHour !== null
        ? `Cleaned up ${duplicateTasks.length} duplicate tasks at ${targetHour}:00`
        : `Cleaned up ${duplicateTasks.length} duplicate tasks across all hours`,
      deletedTasks: duplicateTasks.map(task => ({
        id: task._id,
        title: task.title,
        topic: task.topic?.name,
        startTime: task.startTime
      }))
    });
  } catch (error) {
    console.error('Error cleaning up duplicate time tasks:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clean up duplicate time tasks',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
