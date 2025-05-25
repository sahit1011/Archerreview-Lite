import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task, StudyPlan, Alert } from '@/models';

/**
 * API endpoint for cleaning up duplicate review sessions
 * POST /api/cleanup/duplicate-reviews
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

    // Get all review tasks for this study plan
    const reviewTasks = await Task.find({
      plan: studyPlan._id,
      type: 'REVIEW',
      status: 'PENDING',
      'metadata.isRemediation': true,
      startTime: { $gte: new Date() }
    }).populate('topic');

    // Group tasks by topic
    const tasksByTopic = new Map();
    
    for (const task of reviewTasks) {
      if (!task.topic) continue;
      
      const topicId = task.topic._id.toString();
      
      if (!tasksByTopic.has(topicId)) {
        tasksByTopic.set(topicId, []);
      }
      
      tasksByTopic.get(topicId).push(task);
    }

    // Find topics with multiple review sessions
    const duplicateTasks = [];
    
    for (const [topicId, tasks] of tasksByTopic.entries()) {
      if (tasks.length > 1) {
        // Keep the earliest task, remove the rest
        tasks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        
        // Keep the first task (earliest)
        const taskToKeep = tasks[0];
        
        // Add the rest to the list of duplicates to remove
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
        // Find the task to keep for this topic
        const topicId = alert.relatedTopic?.toString();
        if (!topicId) continue;
        
        const tasksForTopic = tasksByTopic.get(topicId);
        if (!tasksForTopic || tasksForTopic.length === 0) continue;
        
        const taskToKeep = tasksForTopic[0];
        
        // Update the alert to reference the task to keep
        alert.metadata.scheduledTaskId = taskToKeep._id.toString();
        alert.metadata.suggestedAction = `Complete the scheduled review session on ${taskToKeep.startTime.toLocaleDateString()} at ${taskToKeep.startTime.toLocaleTimeString()}`;
        
        await alert.save();
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${duplicateTasks.length} duplicate review sessions`,
      deletedTasks: duplicateTasks.map(task => ({
        id: task._id,
        title: task.title,
        topic: task.topic?.name,
        startTime: task.startTime
      }))
    });
  } catch (error) {
    console.error('Error cleaning up duplicate review sessions:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clean up duplicate review sessions',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
