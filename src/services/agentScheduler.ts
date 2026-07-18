import { AgentType, getEnabledAgents } from './agentRegistry';
import { runAgent, OrchestrationOptions, runStandardSequence, runComprehensiveSequence } from './agentOrchestrator';
import dbConnect from '@/lib/db';
import { User, StudyPlan, ScheduledJob } from '@/models';
import type { IScheduledJob, JobStatus } from '@/models/ScheduledJob';

/**
 * Agent Scheduler - Schedules agent runs based on priority and timing
 *
 * This service:
 * 1. Schedules periodic agent runs
 * 2. Manages event-triggered agent executions
 * 3. Prioritizes agent runs based on user needs
 * 4. Tracks scheduled runs and their results
 *
 * Durability: schedule entries are persisted to MongoDB (the `ScheduledJob`
 * model) rather than a module-level in-memory array, so they survive cold
 * starts / serverless invocations and can be driven by a real cron via
 * POST /api/cron/run-due.
 */

// Schedule types
export type ScheduleType =
  | 'daily'       // Run once per day
  | 'weekly'      // Run once per week
  | 'hourly'      // Run once per hour
  | 'priority'    // Run for priority users (e.g., close to exam)
  | 'event'       // Run in response to an event
  | 'manual';     // Run manually triggered

// Schedule entry — the stable public shape used by API routes. This is a plain
// object projected from a persisted ScheduledJob document.
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

/**
 * Map a persisted ScheduledJob document to the public ScheduleEntry shape.
 * `enabled` is derived from status === 'active'. `interval` (ms) is derived
 * from the stored intervalMinutes.
 */
function toEntry(doc: IScheduledJob): ScheduleEntry {
  return {
    id: String(doc._id),
    agentType: doc.agentType,
    sequenceType: doc.sequenceType,
    scheduleType: doc.type,
    userId: doc.userId,
    lastRun: doc.lastRun,
    nextRun: doc.nextRun,
    interval: typeof doc.intervalMinutes === 'number' ? doc.intervalMinutes * 60 * 1000 : undefined,
    priority: doc.priority,
    enabled: doc.status === 'active',
    params: doc.params,
    options: doc.options as OrchestrationOptions | undefined
  };
}

/**
 * Schedule an agent to run. Persists a ScheduledJob and returns its id.
 * @param entry Schedule entry
 * @returns Schedule entry ID (the persisted document id)
 */
export async function scheduleAgent(entry: Omit<ScheduleEntry, 'id'>): Promise<string> {
  await dbConnect();

  const status: JobStatus = entry.enabled === false ? 'paused' : 'active';
  const intervalMinutes =
    typeof entry.interval === 'number' ? Math.round(entry.interval / 60000) : undefined;

  const doc = await ScheduledJob.create({
    agentType: entry.agentType,
    sequenceType: entry.sequenceType,
    type: entry.scheduleType,
    userId: entry.userId,
    nextRun: calculateNextRun(entry),
    priority: entry.priority ?? 5,
    status,
    intervalMinutes,
    params: entry.params,
    options: entry.options
  });

  return String(doc._id);
}

/**
 * Calculate the next run time for a schedule entry.
 *
 * Previously 'event' (and 'manual') returned undefined, so event-triggered
 * entries got a nextRun of undefined and never executed. Event entries are
 * meant to run immediately, so they now resolve to "now".
 * @param entry Schedule entry
 * @returns Next run time
 */
function calculateNextRun(entry: { scheduleType: ScheduleType; interval?: number }): Date | undefined {
  const now = new Date();

  switch (entry.scheduleType) {
    case 'event':
      // Event-based runs should fire immediately.
      return now;

    case 'manual':
      // Manual runs are only triggered explicitly; no automatic nextRun.
      return undefined;

    case 'daily': {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }

    case 'weekly': {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(0, 0, 0, 0);
      return nextWeek;
    }

    case 'hourly': {
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      return nextHour;
    }

    case 'priority': {
      const fourHours = new Date(now);
      fourHours.setHours(fourHours.getHours() + 4);
      return fourHours;
    }

    default:
      // Fall back to an interval-based schedule if one was supplied.
      if (typeof entry.interval === 'number' && entry.interval > 0) {
        return new Date(now.getTime() + entry.interval);
      }
      return undefined;
  }
}

/**
 * Get all scheduled entries
 * @returns All schedule entries
 */
export async function getAllScheduledEntries(): Promise<ScheduleEntry[]> {
  await dbConnect();
  const docs = await ScheduledJob.find({}).lean<IScheduledJob[]>();
  return docs.map(toEntry);
}

/**
 * Get scheduled entries for a user
 * @param userId User ID
 * @returns Schedule entries for the user
 */
export async function getUserScheduledEntries(userId: string): Promise<ScheduleEntry[]> {
  await dbConnect();
  const docs = await ScheduledJob.find({ userId }).lean<IScheduledJob[]>();
  return docs.map(toEntry);
}

/**
 * Get scheduled entries for an agent
 * @param agentType Agent type
 * @returns Schedule entries for the agent
 */
export async function getAgentScheduledEntries(agentType: AgentType): Promise<ScheduleEntry[]> {
  await dbConnect();
  const docs = await ScheduledJob.find({ agentType }).lean<IScheduledJob[]>();
  return docs.map(toEntry);
}

/**
 * Get scheduled entries due for execution (active + nextRun <= now).
 * @returns Schedule entries due for execution
 */
export async function getDueEntries(limit = 50): Promise<ScheduleEntry[]> {
  await dbConnect();
  const now = new Date();
  // Cap the batch so one cron invocation can't run unbounded work and hit the
  // serverless timeout as the user base grows. Highest priority + oldest-due
  // first; anything not processed this pass is still due and picked up next run.
  const docs = await ScheduledJob.find({
    status: 'active',
    nextRun: { $ne: null, $lte: now }
  })
    .sort({ priority: -1, nextRun: 1 })
    .limit(limit)
    .lean<IScheduledJob[]>();
  return docs.map(toEntry);
}

/**
 * Update a schedule entry.
 * @param id Schedule entry ID
 * @param updates Updates to apply (public ScheduleEntry fields)
 * @returns Updated schedule entry
 */
export async function updateScheduleEntry(
  id: string,
  updates: Partial<ScheduleEntry>
): Promise<ScheduleEntry | undefined> {
  await dbConnect();

  const existing = await ScheduledJob.findById(id);
  if (!existing) {
    return undefined;
  }

  if (updates.agentType !== undefined) existing.agentType = updates.agentType;
  if (updates.sequenceType !== undefined) existing.sequenceType = updates.sequenceType;
  if (updates.userId !== undefined) existing.userId = updates.userId;
  if (updates.lastRun !== undefined) existing.lastRun = updates.lastRun;
  if (updates.nextRun !== undefined) existing.nextRun = updates.nextRun;
  if (updates.priority !== undefined) existing.priority = updates.priority;
  if (updates.params !== undefined) existing.params = updates.params;
  if (updates.options !== undefined) existing.options = updates.options;
  if (updates.interval !== undefined) {
    existing.intervalMinutes = Math.round(updates.interval / 60000);
  }
  if (updates.enabled !== undefined) {
    existing.status = updates.enabled ? 'active' : 'paused';
  }

  // Recalculate next run if the schedule type changed.
  if (updates.scheduleType && updates.scheduleType !== existing.type) {
    existing.type = updates.scheduleType;
    existing.nextRun = calculateNextRun({
      scheduleType: existing.type,
      interval: updates.interval
    });
  }

  await existing.save();
  return toEntry(existing);
}

/**
 * Delete a schedule entry.
 * @param id Schedule entry ID
 * @returns Whether the entry was deleted
 */
export async function deleteScheduleEntry(id: string): Promise<boolean> {
  await dbConnect();
  const result = await ScheduledJob.findByIdAndDelete(id);
  return result !== null;
}

/**
 * Execute a single schedule entry and update its lastRun/nextRun.
 * Shared by processDueEntries and the cron route.
 */
export async function runScheduleEntry(entry: ScheduleEntry): Promise<any> {
  let result;

  if (entry.agentType === 'sequence') {
    if (entry.sequenceType === 'comprehensive') {
      result = await runComprehensiveSequence(entry.userId!, entry.options);
    } else {
      result = await runStandardSequence(entry.userId!, entry.options);
    }
  } else {
    result = await runAgent(entry.agentType, entry.userId!, entry.params || {}, entry.options);
  }

  return result;
}

/**
 * Process due schedule entries.
 * @returns Results of processed entries
 */
export async function processDueEntries(): Promise<any[]> {
  // Connect to the database
  await dbConnect();

  const dueEntries = await getDueEntries();
  const results = [];

  for (const entry of dueEntries) {
    try {
      const result = await runScheduleEntry(entry);

      // Update entry with last run time and calculate next run
      const nextRun = calculateNextRun({ scheduleType: entry.scheduleType, interval: entry.interval });
      await updateScheduleEntry(entry.id, {
        lastRun: new Date(),
        // For one-shot (event/manual) entries nextRun becomes undefined and they
        // won't be picked up again; we clear nextRun by writing null below.
        ...(nextRun ? { nextRun } : {})
      });
      if (!nextRun) {
        await ScheduledJob.findByIdAndUpdate(entry.id, { $set: { nextRun: null } });
      }

      results.push({
        entryId: entry.id,
        success: true,
        result
      });
    } catch (error: any) {
      console.error(`Error processing schedule entry ${entry.id}:`, error);

      // Update entry with last run time and calculate next run
      const nextRun = calculateNextRun({ scheduleType: entry.scheduleType, interval: entry.interval });
      await updateScheduleEntry(entry.id, {
        lastRun: new Date(),
        ...(nextRun ? { nextRun } : {})
      });
      if (!nextRun) {
        await ScheduledJob.findByIdAndUpdate(entry.id, { $set: { nextRun: null } });
      }

      results.push({
        entryId: entry.id,
        success: false,
        error: error?.message ?? String(error)
      });
    }
  }

  return results;
}

/**
 * Schedule standard monitoring for all users (idempotent-ish: only creates a
 * daily entry for a user if one isn't already active).
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

    // Reuse an existing active standard sequence for this user (any cadence) so
    // we never pile up duplicates — cadence-agnostic so the daily→hourly change
    // doesn't double-seed users who already have a job.
    const existingStandard = await ScheduledJob.findOne({
      userId,
      agentType: 'sequence',
      sequenceType: 'standard',
      status: 'active'
    }).lean<IScheduledJob | null>();

    if (existingStandard) {
      entryIds.push(String(existingStandard._id));
    } else {
      const dailyId = await scheduleAgent({
        agentType: 'sequence',
        sequenceType: 'standard',
        scheduleType: 'hourly',
        userId,
        priority: 5,
        enabled: true,
        options: {
          runDependencies: true
        }
      });
      entryIds.push(dailyId);
    }

    // Check if user is close to exam
    const examDate = new Date(plan.examDate);
    const now = new Date();
    const daysUntilExam = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // If user is within 14 days of exam, schedule priority monitoring
    if (daysUntilExam <= 14) {
      const existingPriority = await ScheduledJob.findOne({
        userId,
        agentType: 'sequence',
        type: 'priority',
        status: 'active'
      }).lean<IScheduledJob | null>();

      if (existingPriority) {
        entryIds.push(String(existingPriority._id));
      } else {
        const priorityId = await scheduleAgent({
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
  }

  return entryIds;
}

/**
 * Trigger an event-based agent run.
 *
 * Creates a persisted 'event' entry. Event entries now get a valid nextRun
 * ("now") via calculateNextRun, so processDueEntries actually executes them
 * (previously they had nextRun = undefined and never ran). The temporary entry
 * is deleted afterwards.
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
  // Create a temporary, persisted schedule entry (nextRun = now for 'event').
  const entryId = await scheduleAgent({
    agentType,
    sequenceType: agentType === 'sequence' ? 'standard' : undefined,
    scheduleType: 'event',
    userId,
    priority: 10,
    enabled: true,
    params,
    options
  });

  // Process the entry immediately.
  const results = await processDueEntries();
  const result = results.find(r => r.entryId === entryId);

  // Delete the temporary entry.
  await deleteScheduleEntry(entryId);

  return result;
}
