import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task, StudyPlan, Alert } from '@/models';

/**
 * API endpoint for cleaning up tasks at a specific time
 * POST /api/cleanup/specific-time
 */
export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.userId || !body.time) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: userId and time'
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

    // Parse the time (format: HH:MM)
    const [hours, minutes] = body.time.split(':').map(Number);
    
    // Get all tasks
    const allTasks = await Task.find({
      plan: studyPlan._id,
      status: 'PENDING' // Only consider pending tasks
    }).populate('topic');

    // Filter tasks by the specified time
    const tasksAtTime = allTasks.filter(task => {
      const taskHours = task.startTime.getHours();
      const taskMinutes = task.startTime.getMinutes();
      return taskHours === hours && taskMinutes === minutes;
    });

    // Group tasks by date and topic
    const tasksByDateAndTopic = new Map();
    
    for (const task of tasksAtTime) {
      if (!task.topic) continue;
      
      const topicId = task.topic._id.toString();
      const dateStr = task.startTime.toDateString(); // Group by date
      const key = `${dateStr}_${topicId}`;
      
      if (!tasksByDateAndTopic.has(key)) {
        tasksByDateAndTopic.set(key, []);
      }
      
      tasksByDateAndTopic.get(key).push(task);
    }

    // Find duplicate tasks
    const duplicateTasks = [];
    
    for (const [key, tasks] of tasksByDateAndTopic.entries()) {
      if (tasks.length > 1) {
        // Keep the first task, mark the rest as duplicates
        for (let i = 1; i < tasks.length; i++) {
          duplicateTasks.push(tasks[i]);
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

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${duplicateTasks.length} duplicate tasks at ${body.time}`,
      deletedTasks: duplicateTasks.map(task => ({
        id: task._id,
        title: task.title,
        topic: task.topic?.name,
        startTime: task.startTime
      }))
    });
  } catch (error) {
    console.error('Error cleaning up specific time tasks:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clean up specific time tasks',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
