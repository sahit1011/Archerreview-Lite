import { initializeAgentOrchestration } from './scheduledJobs';

/**
 * Agent Orchestration initializer.
 *
 * This module is imported by the root layout. It must NOT do heavy/blocking DB
 * work as a side effect on the render path:
 *  - no top-level `await` of the DB,
 *  - the import itself returns immediately,
 *  - setup runs at most once per process,
 *  - everything is wrapped in try/catch so a failure can never crash render.
 *
 * Durability note: actual scheduled execution is driven by a real cron hitting
 * POST /api/cron/run-due (jobs are persisted in MongoDB via the ScheduledJob
 * model). This initializer only seeds standard monitoring entries; it is not the
 * execution loop, so it is safe to fire-and-forget.
 */

// Process-wide guard so concurrent imports / hot reloads don't re-trigger setup.
const globalForAgents = globalThis as unknown as {
  __agentsInitialized?: boolean;
};

export async function initializeAgents(): Promise<void> {
  // Server-side only.
  if (typeof window !== 'undefined') return;

  // Run setup at most once per process.
  if (globalForAgents.__agentsInitialized) return;
  globalForAgents.__agentsInitialized = true;

  try {
    console.log('Initializing Agent Orchestration System...');
    await initializeAgentOrchestration();
    console.log('Agent Orchestration System initialized successfully');
  } catch (error) {
    // Never let initialization failures bubble onto the render path.
    console.error('Error initializing Agent Orchestration System:', error);
    // Allow a future attempt to retry rather than staying wedged.
    globalForAgents.__agentsInitialized = false;
  }
}

// Fire-and-forget on import: schedule a microtask-deferred run so the import
// resolves synchronously and never blocks module evaluation / layout render.
// No top-level await; failures are swallowed by initializeAgents' own catch.
if (typeof window === 'undefined') {
  Promise.resolve().then(() => initializeAgents());
}
