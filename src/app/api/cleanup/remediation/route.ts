import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task, StudyPlan, Alert } from '@/models';

/**
 * API endpoint for cleaning up all remediation tasks and alerts
 * POST /api/cleanup/remediation
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

    // Find all remediation tasks
    const remediationTasks = await Task.find({
      plan: studyPlan._id,
      'metadata.isRemediation': true,
      status: 'PENDING' // Only remove pending tasks
    });

    // Delete all remediation tasks
    const deletedTaskIds = [];
    
    for (const task of remediationTasks) {
      await Task.findByIdAndDelete(task._id);
      deletedTaskIds.push(task._id.toString());
    }

    // Find all remediation alerts
    const remediationAlerts = await Alert.find({
      user: body.userId,
      type: 'REMEDIATION',
      isResolved: false
    });

    // Delete or mark as resolved all remediation alerts
    const resolvedAlertIds = [];
    
    for (const alert of remediationAlerts) {
      // Mark as resolved instead of deleting
      alert.isResolved = true;
      alert.resolvedAt = new Date();
      await alert.save();
      
      resolvedAlertIds.push(alert._id.toString());
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${remediationTasks.length} remediation tasks and ${remediationAlerts.length} remediation alerts`,
      deletedTasks: remediationTasks.map(task => ({
        id: task._id,
        title: task.title,
        startTime: task.startTime
      })),
      resolvedAlerts: remediationAlerts.map(alert => ({
        id: alert._id,
        message: alert.message
      }))
    });
  } catch (error) {
    console.error('Error cleaning up remediation items:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clean up remediation items',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
