import {
  AgentType,
  getAgent,
  getAgentDependencies,
  updateAgentStats,
  DependencyType
} from './agentRegistry';
import { runMonitorAgent } from './monitorAgent';
import { runAdaptationAgent } from './adaptationAgent';
import { runRemediationAgent } from './remediationAgent';
import { processFeedback } from './feedbackAgent';
import { generateStudyPlan } from './schedulerAgent';
import { analyzeLongTermTrends } from './evolutionAgent';
import dbConnect from '../lib/db'; // Changed to relative path
import { User, StudyPlan, IStudyPlan } from '../models/index'; // Changed to relative path
import mongoose from 'mongoose'; // For ObjectId

/**
 * Agent Orchestrator - Coordinates the execution of agents
 *
 * This service:
 * 1. Manages agent execution order and dependencies
 * 2. Handles error recovery and fallback mechanisms
 * 3. Tracks agent performance and results
 * 4. Provides a unified interface for triggering agent actions
 */

// Agent execution result
export interface AgentExecutionResult {
  agentType: AgentType;
  success: boolean;
  runtime: number; // in milliseconds
  result: any;
  error?: Error;
  dependencyResults?: Partial<Record<AgentType, AgentExecutionResult>>; // Use Partial here too
}

// Orchestration options
export interface OrchestrationOptions {
  runDependencies?: boolean;
  maxRetries?: number;
  timeout?: number; // in milliseconds
  bypassCache?: boolean;
  forceRun?: boolean;
}

// Default orchestration options
const DEFAULT_OPTIONS: OrchestrationOptions = {
  runDependencies: true,
  maxRetries: 1,
  timeout: 30000, // 30 seconds
  bypassCache: false,
  forceRun: false
};

/**
 * Run an agent with its dependencies
 * @param agentType Type of agent to run
 * @param userId User ID
 * @param params Additional parameters for the agent
 * @param options Orchestration options
 * @returns Agent execution result
 */
export async function runAgent(
  agentType: AgentType,
  userId: string,
  params: Record<string, any> = {},
  options: OrchestrationOptions = {}
): Promise<AgentExecutionResult> {
  // Merge options with defaults
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Connect to the database
  await dbConnect();

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Check if user has a study plan (except for scheduler agent)
  if (agentType !== 'scheduler') {
    const studyPlan = await StudyPlan.findOne({ user: userId });
    if (!studyPlan) {
      throw new Error(`User does not have a study plan: ${userId}`);
    }
  }

  // Get agent metadata
  const agent = getAgent(agentType);
  if (!agent) {
    throw new Error(`Agent not found: ${agentType}`);
  }

  // Check if agent is enabled
  if (!agent.enabled && !mergedOptions.forceRun) {
    throw new Error(`Agent is disabled: ${agentType}`);
  }

  // Get agent dependencies
  const dependencies = getAgentDependencies(agentType);

  // Run dependencies if needed
  const dependencyResults: Partial<Record<AgentType, AgentExecutionResult>> = {}; // Use Partial

  if (mergedOptions.runDependencies && dependencies.length > 0) {
    for (const dependency of dependencies) {
      // Skip optional dependencies if they fail
      try {
        const dependencyResult = await runAgent(
          dependency.agentType,
          userId,
          params,
          { ...mergedOptions, runDependencies: false } // Avoid circular dependencies
        );

        dependencyResults[dependency.agentType] = dependencyResult;
      } catch (err) { // Changed variable name to err
        const castError = err as Error;
        console.error(`Error running dependency ${dependency.agentType} for agent ${agentType}:`, castError);

        // If this is a required dependency, throw error
        if (dependency.dependencyType === 'required') {
          throw new Error(`Required dependency ${dependency.agentType} failed for agent ${agentType}: ${castError.message}`);
        }
      }
    }
  }

  // Execute the agent
  const startTime = Date.now();
  let result;
  let success = false;
  let error: Error | undefined; // Explicitly type error

  try {
    // Execute the agent based on its type
    switch (agentType) {
      case 'monitor':
        result = await runMonitorAgent(userId);
        break;
      case 'adaptation':
        // Use monitor results if available
        const monitorResult = dependencyResults['monitor']?.result;
        result = await runAdaptationAgent(userId, monitorResult);
        break;
      case 'remediation':
        result = await runRemediationAgent(userId);
        break;
      case 'feedback':
        if (!params.feedbackText) {
          throw new Error('Feedback text is required for feedback agent');
        }
        result = await processFeedback(userId, params.feedbackText);
        break;
      case 'scheduler':
        let studyPlanDoc = await StudyPlan.findOne({ user: userId });
        if (!studyPlanDoc) {
          // Attempt to get examDate from user object, or default
          const userDoc = await User.findById(userId).select('examDate preferences');
          const examDate = userDoc?.examDate || new Date(new Date().setMonth(new Date().getMonth() + 3)); // Default 3 months out
          const startDate = new Date();

          studyPlanDoc = new StudyPlan({
            _id: new mongoose.Types.ObjectId(),
            user: userId,
            examDate: examDate,
            startDate: startDate,
            endDate: examDate, // Assuming endDate is same as examDate for initial plan
            isPersonalized: false,
            currentVersion: 1,
            // Add any other required fields with default values
          });
          await studyPlanDoc.save();
          console.log(`Created new StudyPlan with ID: ${studyPlanDoc._id} for user ${userId}`);
        } else {
          console.log(`Found existing StudyPlan with ID: ${studyPlanDoc._id} for user ${userId}`);
        }
        result = await generateStudyPlan(userId, studyPlanDoc._id.toString());
        break;
      case 'evolution':
        // Get period from params or default to MONTHLY
        const period = params.period || 'MONTHLY';
        result = await analyzeLongTermTrends(userId, period);
        break;
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }

    success = true;
  } catch (err) {
    error = err instanceof Error ? err : new Error(String(err));
    console.error(`Error running agent ${agentType}:`, err);
  }

  const endTime = Date.now();
  const runtime = endTime - startTime;

  // Update agent stats
  updateAgentStats(agentType, runtime, success);

  // Return execution result
  return {
    agentType,
    success,
    runtime,
    result,
    error,
    dependencyResults: Object.keys(dependencyResults).length > 0 ? dependencyResults : undefined
  };
}

/**
 * Run multiple agents in sequence
 * @param agentTypes Types of agents to run
 * @param userId User ID
 * @param params Additional parameters for the agents
 * @param options Orchestration options
 * @returns Agent execution results
 */
export async function runAgentSequence(
  agentTypes: AgentType[],
  userId: string,
  params: Record<string, any> = {},
  options: OrchestrationOptions = {}
): Promise<Partial<Record<AgentType, AgentExecutionResult>>> { // Use Partial
  const results: Partial<Record<AgentType, AgentExecutionResult>> = {}; // Use Partial

  for (const agentType of agentTypes) {
    try {
      results[agentType] = await runAgent(agentType, userId, params, options);
    } catch (err) { // Changed variable name to err
      const castError = err instanceof Error ? err : new Error(String(err));
      console.error(`Error running agent ${agentType} in sequence:`, castError);
      results[agentType] = {
        agentType,
        success: false,
        runtime: 0,
        result: null,
        error: castError
      };

      // Stop sequence if an agent fails
      break;
    }
  }

  return results;
}

/**
 * Run the standard monitoring and adaptation sequence
 * @param userId User ID
 * @param options Orchestration options
 * @returns Agent execution results
 */
export async function runStandardSequence(
  userId: string,
  options: OrchestrationOptions = {}
): Promise<Partial<Record<AgentType, AgentExecutionResult>>> { // Use Partial
  return runAgentSequence(['monitor', 'adaptation'], userId, {}, options);
}

/**
 * Run the comprehensive agent sequence (monitor, adaptation, remediation)
 * @param userId User ID
 * @param options Orchestration options
 * @returns Agent execution results
 */
export async function runComprehensiveSequence(
  userId: string,
  options: OrchestrationOptions = {}
): Promise<Partial<Record<AgentType, AgentExecutionResult>>> { // Use Partial
  return runAgentSequence(['monitor', 'adaptation', 'remediation'], userId, {}, options);
}

/**
 * Process user feedback with the feedback agent
 * @param userId User ID
 * @param feedbackText Feedback text
 * @param options Orchestration options
 * @returns Agent execution result
 */
export async function processFeedbackOrchestrated(
  userId: string,
  feedbackText: string,
  options: OrchestrationOptions = {}
): Promise<AgentExecutionResult> {
  return runAgent('feedback', userId, { feedbackText }, options);
}

/**
 * Generate a study plan with the scheduler agent
 * @param userId User ID
 * @param options Orchestration options
 * @returns Agent execution result
 */
export async function generateStudyPlanOrchestrated(
  userId: string,
  options: OrchestrationOptions = {}
): Promise<AgentExecutionResult> {
  return runAgent('scheduler', userId, {}, options);
}

/**
 * Analyze long-term trends with the evolution agent
 * @param userId User ID
 * @param period Analysis period (WEEKLY, MONTHLY, QUARTERLY)
 * @param options Orchestration options
 * @returns Agent execution result
 */
export async function analyzeTrendsOrchestrated(
  userId: string,
  period: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' = 'MONTHLY',
  options: OrchestrationOptions = {}
): Promise<AgentExecutionResult> {
  return runAgent('evolution', userId, { period }, options);
}

/**
 * Run the long-term evolution sequence (monitor, adaptation, evolution)
 * @param userId User ID
 * @param options Orchestration options
 * @returns Agent execution results
 */
export async function runEvolutionSequence(
  userId: string,
  options: OrchestrationOptions = {}
): Promise<Partial<Record<AgentType, AgentExecutionResult>>> {
  return runAgentSequence(['monitor', 'adaptation', 'evolution'], userId, {}, options);
}
