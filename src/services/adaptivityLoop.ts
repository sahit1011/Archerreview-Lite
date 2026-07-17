import { runMonitorAgent } from './monitorAgent';
import { runAdaptationAgent } from './adaptationAgent';
import { runRemediationAgent } from './remediationAgent';

/**
 * The event-driven adaptive-learning loop: monitor -> adaptation -> remediation.
 *
 * Invoked whenever a meaningful student event happens (task completed via the quiz
 * runner OR the dashboard/calendar checkbox). Resilient by design — any agent
 * failure is logged and swallowed so the triggering action never fails.
 *
 * Returns a compact, human-readable summary of what the AI changed so the UI can
 * surface it ("Rescheduled 2 tasks", "Added 1 review session", ...). The full
 * audit trail is persisted by the adaptation agent as Adaptation documents.
 */
export interface AdaptivityLoopResult {
  triggered: boolean;
  changes: string[];
  monitoringStats: unknown | null;
  adaptationSummary: unknown | null;
  remediationSummary: unknown | null;
}

export async function runAdaptivityLoop(userId: string): Promise<AdaptivityLoopResult> {
  try {
    const monitoring = await runMonitorAgent(userId);
    const adaptation = await runAdaptationAgent(userId, monitoring);
    const remediation = await runRemediationAgent(userId);

    const changes: string[] = [];
    const s = adaptation?.summary;
    if (s) {
      if (s.rescheduledTasks) changes.push(`Rescheduled ${s.rescheduledTasks} task${s.rescheduledTasks > 1 ? 's' : ''}`);
      if (s.reviewSessionsAdded) changes.push(`Added ${s.reviewSessionsAdded} review session${s.reviewSessionsAdded > 1 ? 's' : ''}`);
      if (s.difficultyAdjustments) changes.push(`Adjusted difficulty on ${s.difficultyAdjustments} item${s.difficultyAdjustments > 1 ? 's' : ''}`);
      if (s.remedialContentAdded) changes.push(`Added ${s.remedialContentAdded} remedial item${s.remedialContentAdded > 1 ? 's' : ''}`);
      if (s.workloadRebalanced) changes.push('Rebalanced your upcoming workload');
    }
    if (remediation?.summary?.totalActions) {
      changes.push(`${remediation.summary.totalActions} targeted remediation action${remediation.summary.totalActions > 1 ? 's' : ''}`);
    }

    return {
      triggered: true,
      changes,
      monitoringStats: monitoring?.stats ?? null,
      adaptationSummary: adaptation?.summary ?? null,
      remediationSummary: remediation?.summary ?? null,
    };
  } catch (agentError) {
    console.error('Adaptivity loop failed (triggering action still succeeded):', agentError);
    return {
      triggered: false,
      changes: [],
      monitoringStats: null,
      adaptationSummary: null,
      remediationSummary: null,
    };
  }
}
