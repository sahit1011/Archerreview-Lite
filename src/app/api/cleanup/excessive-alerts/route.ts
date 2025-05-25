import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Alert } from '@/models';

/**
 * API endpoint for cleaning up excessive alerts
 * POST /api/cleanup/excessive-alerts
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

    // Get all remediation alerts for this user
    const remediationAlerts = await Alert.find({
      user: body.userId,
      type: 'REMEDIATION',
      isResolved: false
    }).populate('relatedTopic');

    // Group alerts by topic
    const alertsByTopic = new Map();
    const genericAlerts = [];
    
    for (const alert of remediationAlerts) {
      if (alert.relatedTopic) {
        const topicId = alert.relatedTopic._id.toString();
        
        if (!alertsByTopic.has(topicId)) {
          alertsByTopic.set(topicId, []);
        }
        
        alertsByTopic.get(topicId).push(alert);
      } else {
        // Handle generic alerts (not related to a specific topic)
        genericAlerts.push(alert);
      }
    }

    // Find topics with multiple alerts
    const excessiveAlerts = [];
    
    // Process topic-specific alerts
    for (const [topicId, alerts] of alertsByTopic.entries()) {
      if (alerts.length > 1) {
        // Keep the most recent alert, mark the rest as resolved
        alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // Keep the first alert (most recent)
        const alertToKeep = alerts[0];
        
        // Add the rest to the list of excessive alerts to resolve
        for (let i = 1; i < alerts.length; i++) {
          excessiveAlerts.push(alerts[i]);
        }
      }
    }

    // Process generic alerts - keep only the 3 most recent
    if (genericAlerts.length > 3) {
      genericAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Keep the first 3 alerts (most recent)
      for (let i = 3; i < genericAlerts.length; i++) {
        excessiveAlerts.push(genericAlerts[i]);
      }
    }

    // Mark excessive alerts as resolved
    const resolvedAlertIds = [];
    
    for (const alert of excessiveAlerts) {
      alert.isResolved = true;
      alert.resolvedAt = new Date();
      await alert.save();
      resolvedAlertIds.push(alert._id.toString());
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${excessiveAlerts.length} excessive alerts`,
      resolvedAlerts: excessiveAlerts.map(alert => ({
        id: alert._id,
        message: alert.message,
        topic: alert.relatedTopic?.name,
        createdAt: alert.createdAt
      }))
    });
  } catch (error) {
    console.error('Error cleaning up excessive alerts:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clean up excessive alerts',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
