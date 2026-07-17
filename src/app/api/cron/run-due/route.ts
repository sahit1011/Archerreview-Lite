import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import {
  getDueEntries,
  runScheduleEntry,
  ScheduleEntry
} from '@/services/agentScheduler';
import { ScheduledJob } from '@/models';

/**
 * Cron entry point for durable agent scheduling.
 *
 * POST /api/cron/run-due
 *
 * Finds due jobs (status active, nextRun <= now), runs the appropriate agent /
 * sequence for each, updates lastRun, computes the next nextRun, and returns a
 * summary. Designed to be driven by a real cron (Vercel Cron / GitHub Actions /
 * curl) rather than an in-process timer, so scheduling survives cold starts.
 *
 * Auth: a shared header secret. Set CRON_SECRET and send it in the
 * `x-cron-secret` request header. If CRON_SECRET is unset, the route is allowed
 * only outside production (NODE_ENV !== 'production'), with a warning.
 */

// Run on the Node runtime (needs Mongoose / DB access).
export const runtime = 'nodejs';
// Never cache — this mutates state and must run on every invocation.
export const dynamic = 'force-dynamic';

/**
 * Compute the next run time for a recurring schedule. One-shot schedules
 * (event/manual) return undefined, which clears nextRun so they won't re-run.
 */
function computeNextRun(entry: ScheduleEntry): Date | undefined {
  const now = new Date();

  switch (entry.scheduleType) {
    case 'daily': {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      return next;
    }
    case 'weekly': {
      const next = new Date(now);
      next.setDate(next.getDate() + 7);
      next.setHours(0, 0, 0, 0);
      return next;
    }
    case 'hourly': {
      const next = new Date(now);
      next.setHours(next.getHours() + 1, 0, 0, 0);
      return next;
    }
    case 'priority': {
      const next = new Date(now);
      next.setHours(next.getHours() + 4);
      return next;
    }
    case 'event':
    case 'manual':
      // One-shot: do not reschedule.
      return undefined;
    default:
      // Interval-based fallback.
      if (typeof entry.interval === 'number' && entry.interval > 0) {
        return new Date(now.getTime() + entry.interval);
      }
      return undefined;
  }
}

/**
 * Authorize the cron request. Accepts EITHER:
 *  - Vercel Cron's automatic `Authorization: Bearer <CRON_SECRET>` header
 *    (Vercel injects this when a CRON_SECRET env var is set — the standard mechanism), or
 *  - a manual `x-cron-secret: <CRON_SECRET>` header (for curl/self-hosted triggers).
 * Returns null when authorized, or a NextResponse (401) when not.
 */
function authorizeCron(request: NextRequest): NextResponse | null {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[cron/run-due] CRON_SECRET is not set; allowing request in non-production. ' +
        'Set CRON_SECRET before deploying to production.'
      );
      return null;
    }
    return NextResponse.json(
      { success: false, message: 'CRON_SECRET is not configured' },
      { status: 401 }
    );
  }

  const bearer = request.headers.get('authorization'); // Vercel Cron: "Bearer <secret>"
  const custom = request.headers.get('x-cron-secret'); // manual triggers
  const authorized = bearer === `Bearer ${expected}` || custom === expected;
  if (!authorized) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized cron request' },
      { status: 401 }
    );
  }

  return null;
}

export async function POST(request: NextRequest) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    const dueEntries = await getDueEntries();
    const results: Array<{
      entryId: string;
      agentType: string;
      userId?: string;
      success: boolean;
      nextRun: Date | null;
      error?: string;
    }> = [];

    for (const entry of dueEntries) {
      const nextRun = computeNextRun(entry) ?? null;
      try {
        await runScheduleEntry(entry);

        await ScheduledJob.findByIdAndUpdate(entry.id, {
          $set: { lastRun: new Date(), nextRun }
        });

        results.push({
          entryId: entry.id,
          agentType: entry.agentType,
          userId: entry.userId,
          success: true,
          nextRun
        });
      } catch (error: any) {
        console.error(`[cron/run-due] Error running schedule entry ${entry.id}:`, error);

        // Still advance lastRun/nextRun so a single failure doesn't wedge the queue.
        await ScheduledJob.findByIdAndUpdate(entry.id, {
          $set: { lastRun: new Date(), nextRun }
        });

        results.push({
          entryId: entry.id,
          agentType: entry.agentType,
          userId: entry.userId,
          success: false,
          nextRun,
          error: error?.message ?? String(error)
        });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.length - succeeded;

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} due job(s): ${succeeded} succeeded, ${failed} failed`,
      processed: results.length,
      succeeded,
      failed,
      results
    });
  } catch (error: any) {
    console.error('[cron/run-due] Failed to process due jobs:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process due jobs',
        error: error?.message ?? String(error)
      },
      { status: 500 }
    );
  }
}
