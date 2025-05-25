import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, StudyPlan } from '@/models';
import { 
  scheduleAgent, 
  updateScheduleEntry, 
  deleteScheduleEntry, 
  processDueEntries, 
  scheduleStandardMonitoringForAllUsers, 
  getAllScheduledEntries, 
  getUserScheduledEntries 
} from '@/services/agentScheduler';

/**
 * API endpoint for scheduling agents
 * POST /api/agents/schedule
 * Body: { agentType: string, userId: string, scheduleType: string, ... }
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.agentType || !body.scheduleType) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: agentType and scheduleType' 
        },
        { status: 400 }
      );
    }
    
    // If userId is provided, check if user exists
    if (body.userId) {
      const user = await User.findById(body.userId);
      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'User not found' 
          },
          { status: 404 }
        );
      }
      
      // Check if user has a study plan (except for scheduler agent)
      if (body.agentType !== 'scheduler' && body.agentType !== 'sequence') {
        const studyPlan = await StudyPlan.findOne({ user: body.userId });
        if (!studyPlan) {
          return NextResponse.json(
            { 
              success: false, 
              message: 'User does not have a study plan' 
            },
            { status: 400 }
          );
        }
      }
    }
    
    // Schedule the agent
    const scheduleId = scheduleAgent({
      agentType: body.agentType,
      sequenceType: body.sequenceType,
      scheduleType: body.scheduleType,
      userId: body.userId,
      interval: body.interval,
      priority: body.priority || 5,
      enabled: body.enabled !== false,
      params: body.params,
      options: body.options
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Agent scheduled successfully',
      scheduleId
    });
  } catch (error) {
    console.error('Error scheduling agent:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to schedule agent',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for getting scheduled agents
 * GET /api/agents/schedule
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const scheduleId = searchParams.get('id');
    
    // Return specific schedule if ID is provided
    if (scheduleId) {
      const scheduleEntry = getAllScheduledEntries().find(entry => entry.id === scheduleId);
      
      if (!scheduleEntry) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Schedule entry not found: ${scheduleId}` 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        scheduleEntry
      });
    }
    
    // Return schedules for a specific user if userId is provided
    if (userId) {
      const scheduleEntries = getUserScheduledEntries(userId);
      
      return NextResponse.json({
        success: true,
        scheduleEntries
      });
    }
    
    // Return all schedules
    const scheduleEntries = getAllScheduledEntries();
    
    return NextResponse.json({
      success: true,
      scheduleEntries
    });
  } catch (error) {
    console.error('Error getting scheduled agents:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to get scheduled agents',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for updating scheduled agents
 * PUT /api/agents/schedule
 * Body: { id: string, updates: object }
 */
export async function PUT(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.id || !body.updates) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: id and updates' 
        },
        { status: 400 }
      );
    }
    
    // Update the schedule entry
    const updatedEntry = updateScheduleEntry(body.id, body.updates);
    
    if (!updatedEntry) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Schedule entry not found: ${body.id}` 
        },
        { status: 404 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Schedule entry updated successfully',
      scheduleEntry: updatedEntry
    });
  } catch (error) {
    console.error('Error updating scheduled agent:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update scheduled agent',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for deleting scheduled agents
 * DELETE /api/agents/schedule
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required field: id' 
        },
        { status: 400 }
      );
    }
    
    // Delete the schedule entry
    const deleted = deleteScheduleEntry(body.id);
    
    if (!deleted) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Schedule entry not found: ${body.id}` 
        },
        { status: 404 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Schedule entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting scheduled agent:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete scheduled agent',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
