import { NextRequest, NextResponse } from 'next/server';
import { 
  processDueEntries, 
  scheduleStandardMonitoringForAllUsers, 
  getDueEntries 
} from '@/services/agentScheduler';

/**
 * API endpoint for processing scheduled agents
 * POST /api/agents/process
 * This endpoint is meant to be called by a cron job or similar scheduler
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Check for admin key (simple protection for demo)
    if (!body.adminKey || body.adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized access' 
        },
        { status: 401 }
      );
    }
    
    // Get due entries before processing
    const dueEntries = getDueEntries();
    
    // Process due entries
    const results = await processDueEntries();
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} scheduled entries`,
      dueEntries: dueEntries.map(entry => ({
        id: entry.id,
        agentType: entry.agentType,
        sequenceType: entry.sequenceType,
        scheduleType: entry.scheduleType,
        userId: entry.userId,
        nextRun: entry.nextRun
      })),
      results
    });
  } catch (error) {
    console.error('Error processing scheduled agents:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process scheduled agents',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for scheduling standard monitoring for all users
 * PUT /api/agents/process
 * This endpoint is meant to be called by an admin to set up monitoring for all users
 */
export async function PUT(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Check for admin key (simple protection for demo)
    if (!body.adminKey || body.adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized access' 
        },
        { status: 401 }
      );
    }
    
    // Schedule standard monitoring for all users
    const scheduleIds = await scheduleStandardMonitoringForAllUsers();
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: `Scheduled monitoring for ${scheduleIds.length} entries`,
      scheduleIds
    });
  } catch (error) {
    console.error('Error scheduling monitoring for all users:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to schedule monitoring for all users',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
