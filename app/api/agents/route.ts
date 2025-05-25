import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, StudyPlan } from '@/models';
import { 
  runAgent, 
  runAgentSequence, 
  runStandardSequence, 
  runComprehensiveSequence 
} from '@/services/agentOrchestrator';
import { 
  getAllAgents, 
  getAgent, 
  getEnabledAgents, 
  AgentType 
} from '@/services/agentRegistry';
import { 
  getAllScheduledEntries, 
  getUserScheduledEntries, 
  scheduleAgent, 
  updateScheduleEntry, 
  deleteScheduleEntry, 
  processDueEntries, 
  scheduleStandardMonitoringForAllUsers, 
  triggerEventBasedRun 
} from '@/services/agentScheduler';

/**
 * API endpoint for getting information about available agents
 * GET /api/agents
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const agentType = searchParams.get('type') as AgentType | null;
    const enabledOnly = searchParams.get('enabledOnly') === 'true';
    const userId = searchParams.get('userId');
    const includeSchedule = searchParams.get('includeSchedule') === 'true';
    
    // Return specific agent if type is provided
    if (agentType) {
      const agent = getAgent(agentType);
      
      if (!agent) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Agent not found: ${agentType}` 
          },
          { status: 404 }
        );
      }
      
      // Include schedule information if requested
      let scheduleEntries;
      if (includeSchedule) {
        if (userId) {
          scheduleEntries = getUserScheduledEntries(userId).filter(
            entry => entry.agentType === agentType
          );
        } else {
          scheduleEntries = getAllScheduledEntries().filter(
            entry => entry.agentType === agentType
          );
        }
      }
      
      return NextResponse.json({
        success: true,
        agent,
        scheduleEntries
      });
    }
    
    // Return all agents
    const agents = enabledOnly ? getEnabledAgents() : getAllAgents();
    
    // Include schedule information if requested
    let scheduleEntries;
    if (includeSchedule) {
      if (userId) {
        scheduleEntries = getUserScheduledEntries(userId);
      } else {
        scheduleEntries = getAllScheduledEntries();
      }
    }
    
    return NextResponse.json({
      success: true,
      agents,
      scheduleEntries
    });
  } catch (error) {
    console.error('Error getting agents:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to get agents',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for running agents
 * POST /api/agents
 * Body: { agentType: string, userId: string, params?: object, options?: object }
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.agentType || !body.userId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: agentType and userId' 
        },
        { status: 400 }
      );
    }
    
    // Check if user exists
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
    
    // Run the agent or sequence
    let result;
    
    if (body.agentType === 'sequence') {
      // Run a sequence of agents
      const sequenceType = body.sequenceType || 'standard';
      
      if (sequenceType === 'standard') {
        result = await runStandardSequence(body.userId, body.options);
      } else if (sequenceType === 'comprehensive') {
        result = await runComprehensiveSequence(body.userId, body.options);
      } else if (Array.isArray(body.agents)) {
        result = await runAgentSequence(body.agents, body.userId, body.params, body.options);
      } else {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid sequence configuration. Provide sequenceType or agents array.' 
          },
          { status: 400 }
        );
      }
    } else {
      // Run a single agent
      result = await runAgent(body.agentType, body.userId, body.params, body.options);
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: `Agent ${body.agentType} run successfully`,
      result
    });
  } catch (error) {
    console.error('Error running agent:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to run agent',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
