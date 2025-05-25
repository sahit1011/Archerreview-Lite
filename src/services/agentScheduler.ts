import { AgentType, getEnabledAgents } from './agentRegistry';
import { runAgent, OrchestrationOptions, runStandardSequence, runComprehensiveSequence } from './agentOrchestrator';
import dbConnect from '@/lib/db';
import { User, StudyPlan } from '@/models';

/**
 * Agent Scheduler - Schedules agent runs based on priority and timing
 * 
 * This service:
 * 1. Schedules periodic agent runs
 * 2. Manages event-triggered agent executions
 * 3. Prioritizes agent runs based on user needs
 * 4. Tracks scheduled runs and their results
 */

// Schedule types
export type ScheduleType = 
  | 'daily'       // Run once per day
  | 'weekly'      // Run once per week
  | 'hourly'      // Run once per hour
  | 'priority'    // Run for priority users (e.g., close to exam)
  | 'event'       // Run in response to an event
  | 'manual';     // Run manually triggered

// Schedule entry
export interface ScheduleEntry {
  id: string;
  agentType: AgentType | 'sequence';
  sequenceType?: 'standard' | 'comprehensive';
  scheduleType: ScheduleType;
  userId?: string;
  lastRun?: Date;
  nextRun?: Date;
  interval?: number; // in milliseconds
  priority: number; // 1-10, higher is more important
  enabled: boolean;
  params?: Record<string, any>;
  options?: OrchestrationOptions;
}

// In-memory schedule storage (would be replaced with database in production)
let scheduleEntries: ScheduleEntry[] = [];

/**
 * Schedule an agent to run
 * @param entry Schedule entry
 * @returns Schedule entry ID
 */
export function scheduleAgent(entry: Omit<ScheduleEntry, 'id'>): string {
  const id = `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  const newEntry: ScheduleEntry = {
    ...entry,
    id,
    nextRun: calculateNextRun(entry)
  };
  
  scheduleEntries.push(newEntry);
  return id;
}

/**
 * Calculate the next run time for a schedule entry
 * @param entry Schedule entry
 * @returns Next run time
 */
function calculateNextRun(entry: Omit<ScheduleEntry, 'id' | 'nextRun'>): Date | undefined {
  if (entry.scheduleType === 'manual' || entry.scheduleType === 'event') {
    return undefined;
  }
  
  const now = new Date();
  
  switch (entry.scheduleType) {
    case 'daily':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    
    case 'weekly':
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(0, 0, 0, 0);
      return nextWeek;
    
    case 'hourly':
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      return nextHour;
    
    case 'priority':
      const fourHours = new Date(now);
      fourHours.setHours(fourHours.getHours() + 4);
      return fourHours;
    
    default:
      return undefined;
  }
}

/**
 * Get all scheduled entries
 * @returns All schedule entries
 */
export function getAllScheduledEntries(): ScheduleEntry[] {
  return [...scheduleEntries];
}

/**
 * Get scheduled entries for a user
 * @param userId User ID
 * @returns Schedule entries for the user
 */
export function getUserScheduledEntries(userId: string): ScheduleEntry[] {
  return scheduleEntries.filter(entry => entry.userId === userId);
}

/**
 * Get scheduled entries for an agent
 * @param agentType Agent type
 * @returns Schedule entries for the agent
 */
export function getAgentScheduledEntries(agentType: AgentType): ScheduleEntry[] {
  return scheduleEntries.filter(entry => entry.agentType === agentType);
}

/**
 * Get scheduled entries due for execution
 * @returns Schedule entries due for execution
 */
export function getDueEntries(): ScheduleEntry[] {
  const now = new Date();
  return scheduleEntries.filter(entry => 
    entry.enabled && 
    entry.nextRun && 
    entry.nextRun <= now
  );
}

/**
 * Update a schedule entry
 * @param id Schedule entry ID
 * @param updates Updates to apply
 * @returns Updated schedule entry
 */
export function updateScheduleEntry(id: string, updates: Partial<ScheduleEntry>): ScheduleEntry | undefined {
  const index = scheduleEntries.findIndex(entry => entry.id === id);
  
  if (index === -1) {
    return undefined;
  }
  
  const updatedEntry = {
    ...scheduleEntries[index],
    ...updates
  };
  
  // Recalculate next run if schedule type changed
  if (updates.scheduleType && updates.scheduleType !== scheduleEntries[index].scheduleType) {
    updatedEntry.nextRun = calculateNextRun(updatedEntry);
  }
  
  scheduleEntries[index] = updatedEntry;
  return updatedEntry;
}

/**
 * Delete a schedule entry
 * @param id Schedule entry ID
 * @returns Whether the entry was deleted
 */
export function deleteScheduleEntry(id: string): boolean {
  const initialLength = scheduleEntries.length;
  scheduleEntries = scheduleEntries.filter(entry => entry.id !== id);
  return scheduleEntries.length < initialLength;
}

/**
 * Process due schedule entries
 * @returns Results of processed entries
 */
export async function processDueEntries(): Promise<any[]> {
  const dueEntries = getDueEntries();
  const results = [];
  
  // Connect to the database
  await dbConnect();
  
  for (const entry of dueEntries) {
    try {
      let result;
      
      // Execute the entry based on its type
      if (entry.agentType === 'sequence') {
        if (entry.sequenceType === 'comprehensive') {
          result = await runComprehensiveSequence(entry.userId!, entry.options);
        } else {
          result = await runStandardSequence(entry.userId!, entry.options);
        }
      } else {
        result = await runAgent(entry.agentType, entry.userId!, entry.params || {}, entry.options);
      }
      
      // Update entry with last run time and calculate next run
      updateScheduleEntry(entry.id, {
        lastRun: new Date(),
        nextRun: calculateNextRun(entry)
      });
      
      results.push({
        entryId: entry.id,
        success: true,
        result
      });
    } catch (error) {
      console.error(`Error processing schedule entry ${entry.id}:`, error);
      
      // Update entry with last run time and calculate next run
      updateScheduleEntry(entry.id, {
        lastRun: new Date(),
        nextRun: calculateNextRun(entry)
      });
      
      results.push({
        entryId: entry.id,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Schedule standard monitoring for all users
 * @returns Schedule entry IDs
 */
export async function scheduleStandardMonitoringForAllUsers(): Promise<string[]> {
  // Connect to the database
  await dbConnect();
  
  // Get all users with study plans
  const studyPlans = await StudyPlan.find({});
  const entryIds: string[] = [];
  
  for (const plan of studyPlans) {
    const userId = plan.user.toString();
    
    // Schedule daily monitoring
    const dailyId = scheduleAgent({
      agentType: 'sequence',
      sequenceType: 'standard',
      scheduleType: 'daily',
      userId,
      priority: 5,
      enabled: true,
      options: {
        runDependencies: true
      }
    });
    
    entryIds.push(dailyId);
    
    // Check if user is close to exam
    const examDate = new Date(plan.examDate);
    const now = new Date();
    const daysUntilExam = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // If user is within 14 days of exam, schedule priority monitoring
    if (daysUntilExam <= 14) {
      const priorityId = scheduleAgent({
        agentType: 'sequence',
        sequenceType: 'comprehensive',
        scheduleType: 'priority',
        userId,
        priority: 8,
        enabled: true,
        options: {
          runDependencies: true
        }
      });
      
      entryIds.push(priorityId);
    }
  }
  
  return entryIds;
}

/**
 * Trigger an event-based agent run
 * @param agentType Agent type
 * @param userId User ID
 * @param params Additional parameters
 * @param options Orchestration options
 * @returns Result of the agent run
 */
export async function triggerEventBasedRun(
  agentType: AgentType | 'sequence',
  userId: string,
  params: Record<string, any> = {},
  options: OrchestrationOptions = {}
): Promise<any> {
  // Create a temporary schedule entry
  const entryId = scheduleAgent({
    agentType,
    sequenceType: agentType === 'sequence' ? 'standard' : undefined,
    scheduleType: 'event',
    userId,
    priority: 10,
    enabled: true,
    params,
    options
  });
  
  // Process the entry immediately
  const results = await processDueEntries();
  const result = results.find(r => r.entryId === entryId);
  
  // Delete the temporary entry
  deleteScheduleEntry(entryId);
  
  return result;
}
