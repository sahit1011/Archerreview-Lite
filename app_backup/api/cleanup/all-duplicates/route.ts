import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task, StudyPlan, Alert } from '@/models';

/**
 * API endpoint for cleaning up all duplicate tasks across the calendar
 * POST /api/cleanup/all-duplicates
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

    // Group tasks by date, time, and topic
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

    // Find duplicate tasks
    const duplicateTasks = [];
    const duplicatesByTime = new Map();
    
    for (const [key, tasks] of tasksByDateTimeAndTopic.entries()) {
      if (tasks.length > 1) {
        // Keep the first task, mark the rest as duplicates
        for (let i = 1; i < tasks.length; i++) {
          duplicateTasks.push(tasks[i]);
          
          // Track duplicates by time for reporting
          const task = tasks[i];
          const startTime = new Date(task.startTime);
          const timeKey = `${startTime.getHours()}:${startTime.getMinutes()}`;
          
          if (!duplicatesByTime.has(timeKey)) {
            duplicatesByTime.set(timeKey, []);
          }
          
          duplicatesByTime.get(timeKey).push(task);
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
      message: `Cleaned up ${duplicateTasks.length} duplicate tasks across the calendar`,
      deletedTasks: duplicateTasks.map(task => ({
        id: task._id,
        title: task.title,
        topic: task.topic?.name,
        startTime: task.startTime
      })),
      timesSummary
    });
  } catch (error) {
    console.error('Error cleaning up all duplicate tasks:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clean up all duplicate tasks',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
