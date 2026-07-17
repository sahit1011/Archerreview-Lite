import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Alert } from '@/models';
import { getUnresolvedAlerts, resolveAlert } from '@/services/monitorAgent';
import { requireAuth } from '@/lib/api-auth';

/**
 * API endpoint for getting alerts
 * GET /api/alerts
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate: userId is derived from the verified token, never the client
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Get unresolved alerts for the authenticated user
    const alerts = await getUnresolvedAlerts(userId);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      alerts
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to get alerts',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for resolving an alert
 * POST /api/alerts
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate: userId is derived from the verified token, never the client
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.alertId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required field: alertId'
        },
        { status: 400 }
      );
    }

    // Check if alert exists
    const alert = await Alert.findById(body.alertId);
    if (!alert) {
      return NextResponse.json(
        {
          success: false,
          message: 'Alert not found'
        },
        { status: 404 }
      );
    }

    // Ownership check: the alert must belong to the authenticated user
    if (!alert.user || alert.user.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Alert not found'
        },
        { status: 404 }
      );
    }

    // Resolve alert
    const updatedAlert = await resolveAlert(body.alertId);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Alert resolved successfully',
      alert: updatedAlert
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to resolve alert',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
