import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task, StudyPlan, Alert } from '@/models';

/**
 * API endpoint for cleaning up all duplicate sessions in the calendar
 * POST /api/cleanup/duplicate-sessions
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

    // Get all pending tasks
    const allTasks = await Task.find({
      plan: studyPlan._id,
      status: 'PENDING'
    }).populate('topic');

    console.log(`Found ${allTasks.length} pending tasks for cleanup`);

    // First approach: Group tasks by date, time, and topic
    const tasksByDateTimeAndTopic = new Map();

    for (const task of allTasks) {
      if (!task.topic) continue;

      const topicId = task.topic._id.toString();
      const startTime = new Date(task.startTime);
      const dateStr = startTime.toDateString();
      const timeStr = `${startTime.getHours()}:${startTime.getMinutes()}`;
      const key = `${dateStr}_${timeStr}_${topicId}`;

      if (!tasksByDateTimeAndTopic.has(key)) {
        tasksByDateTimeAndTopic.set(key, []);
      }

      tasksByDateTimeAndTopic.get(key).push(task);
    }

    // Second approach: Group tasks just by time and topic (across all dates)
    const tasksByTimeAndTopic = new Map();

    for (const task of allTasks) {
      if (!task.topic) continue;

      const topicId = task.topic._id.toString();
      const startTime = new Date(task.startTime);
      const timeStr = `${startTime.getHours()}:${startTime.getMinutes()}`;
      const key = `${timeStr}_${topicId}`;

      if (!tasksByTimeAndTopic.has(key)) {
        tasksByTimeAndTopic.set(key, []);
      }

      tasksByTimeAndTopic.get(key).push(task);
    }

    // Third approach: Group tasks just by time (across all topics and dates)
    const tasksByTime = new Map();

    for (const task of allTasks) {
      const startTime = new Date(task.startTime);
      const timeStr = `${startTime.getHours()}:${startTime.getMinutes()}`;

      if (!tasksByTime.has(timeStr)) {
        tasksByTime.set(timeStr, []);
      }

      tasksByTime.get(timeStr).push(task);
    }

    // Find duplicate tasks using all three approaches
    const duplicateTasks = [];
    const duplicatesByTime = new Map();
    const processedTaskIds = new Set();

    // First approach: Find duplicates by date, time, and topic
    console.log("Approach 1: Finding duplicates by date, time, and topic");
    for (const [key, tasks] of tasksByDateTimeAndTopic.entries()) {
      if (tasks.length > 1) {
        // Keep the first task, mark the rest as duplicates
        for (let i = 1; i < tasks.length; i++) {
          const task = tasks[i];
          if (!processedTaskIds.has(task._id.toString())) {
            duplicateTasks.push(task);
            processedTaskIds.add(task._id.toString());

            // Track duplicates by time for reporting
            const startTime = new Date(task.startTime);
            const timeKey = `${startTime.getHours()}:${startTime.getMinutes()}`;

            if (!duplicatesByTime.has(timeKey)) {
              duplicatesByTime.set(timeKey, []);
            }

            duplicatesByTime.get(timeKey).push(task);
          }
        }
      }
    }

    console.log(`Approach 1: Found ${duplicateTasks.length} duplicates`);

    // Second approach: Find duplicates by time and topic (across all dates)
    console.log("Approach 2: Finding duplicates by time and topic (across all dates)");
    for (const [key, tasks] of tasksByTimeAndTopic.entries()) {
      if (tasks.length > 1) {
        // Sort tasks by date
        tasks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        // Keep one task per date, remove others
        const tasksByDate = new Map();

        for (const task of tasks) {
          const startTime = new Date(task.startTime);
          const dateStr = startTime.toDateString();

          if (!tasksByDate.has(dateStr)) {
            tasksByDate.set(dateStr, []);
          }

          tasksByDate.get(dateStr).push(task);
        }

        // For each date, keep the first task and mark others as duplicates
        for (const [dateStr, dateTasks] of tasksByDate.entries()) {
          if (dateTasks.length > 1) {
            for (let i = 1; i < dateTasks.length; i++) {
              const task = dateTasks[i];
              if (!processedTaskIds.has(task._id.toString())) {
                duplicateTasks.push(task);
                processedTaskIds.add(task._id.toString());

                // Track duplicates by time for reporting
                const startTime = new Date(task.startTime);
                const timeKey = `${startTime.getHours()}:${startTime.getMinutes()}`;

                if (!duplicatesByTime.has(timeKey)) {
                  duplicatesByTime.set(timeKey, []);
                }

                duplicatesByTime.get(timeKey).push(task);
              }
            }
          }
        }
      }
    }

    console.log(`Approach 2: Found ${duplicateTasks.length} duplicates total`);

    // Third approach: Find excessive duplicates by time (across all topics and dates)
    console.log("Approach 3: Finding excessive duplicates by time (across all topics and dates)");
    for (const [timeStr, tasks] of tasksByTime.entries()) {
      // If there are more than 3 tasks at the same time, consider it excessive
      if (tasks.length > 3) {
        // Sort tasks by date and topic
        tasks.sort((a, b) => {
          const aDate = new Date(a.startTime).getTime();
          const bDate = new Date(b.startTime).getTime();

          if (aDate !== bDate) {
            return aDate - bDate;
          }

          const aTopic = a.topic?._id.toString() || '';
          const bTopic = b.topic?._id.toString() || '';

          return aTopic.localeCompare(bTopic);
        });

        // Keep the first 3 tasks, mark the rest as duplicates
        for (let i = 3; i < tasks.length; i++) {
          const task = tasks[i];
          if (!processedTaskIds.has(task._id.toString())) {
            duplicateTasks.push(task);
            processedTaskIds.add(task._id.toString());

            // Track duplicates by time for reporting
            if (!duplicatesByTime.has(timeStr)) {
              duplicatesByTime.set(timeStr, []);
            }

            duplicatesByTime.get(timeStr).push(task);
          }
        }
      }
    }

    console.log(`Approach 3: Found ${duplicateTasks.length} duplicates total`);

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
        // Mark the alert as resolved
        alert.isResolved = true;
        alert.resolvedAt = new Date();

        await alert.save();
      }
    }

    // Prepare summary by time
    const timesSummary = Array.from(duplicatesByTime.entries()).map(([time, tasks]) => ({
      time,
      count: tasks.length
    })).sort((a, b) => {
      // Sort by time (HH:MM)
      const [aHours, aMinutes] = a.time.split(':').map(Number);
      const [bHours, bMinutes] = b.time.split(':').map(Number);

      if (aHours !== bHours) {
        return aHours - bHours;
      }

      return aMinutes - bMinutes;
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${duplicateTasks.length} duplicate sessions across the calendar`,
      deletedTasks: duplicateTasks.map(task => ({
        id: task._id,
        title: task.title,
        topic: task.topic?.name,
        startTime: task.startTime
      })),
      timesSummary
    });
  } catch (error) {
    console.error('Error cleaning up duplicate sessions:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clean up duplicate sessions',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
