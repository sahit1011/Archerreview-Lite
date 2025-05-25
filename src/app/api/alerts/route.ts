import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Alert, User } from '@/models';
import { getUnresolvedAlerts, resolveAlert } from '@/services/monitorAgent';

/**
 * API endpoint for getting alerts
 * GET /api/alerts?userId=123
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Get user ID from query params
    const userId = request.nextUrl.searchParams.get('userId');
    
    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required query parameter: userId' 
        },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User not found' 
        },
        { status: 404 }
      );
    }
    
    // Get unresolved alerts
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
