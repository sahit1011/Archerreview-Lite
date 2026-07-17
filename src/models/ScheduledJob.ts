import mongoose, { Schema, Document } from 'mongoose';
import { AgentType } from '@/services/agentRegistry';

/**
 * ScheduledJob - Durable persistence for agent scheduling.
 *
 * Replaces the previous module-level in-memory `scheduleEntries` array in
 * agentScheduler.ts, which was wiped on every cold start / serverless invocation.
 * Persisting to MongoDB lets a real cron (Vercel Cron / GitHub Actions / curl)
 * drive due-job execution via POST /api/cron/run-due.
 */

export type ScheduleType =
  | 'daily'
  | 'weekly'
  | 'hourly'
  | 'priority'
  | 'event'
  | 'manual';

export type JobStatus = 'active' | 'paused' | 'completed' | 'failed';

export interface IScheduledJob extends Document {
  // The user this job runs for. Stored as a string to stay flexible (matches the
  // string userId used throughout the agent services), while still being indexable.
  userId?: string;
  // Either a concrete agent type or a 'sequence' run.
  agentType: AgentType | 'sequence';
  sequenceType?: 'standard' | 'comprehensive';
  type: ScheduleType; // schedule cadence
  nextRun?: Date;
  lastRun?: Date;
  status: JobStatus;
  intervalMinutes?: number;
  priority: number;
  params?: Record<string, any>;
  options?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledJobSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      index: true
    },
    agentType: {
      type: String,
      required: true
    },
    sequenceType: {
      type: String,
      enum: ['standard', 'comprehensive']
    },
    type: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'hourly', 'priority', 'event', 'manual'],
      default: 'manual'
    },
    nextRun: {
      type: Date,
      index: true
    },
    lastRun: {
      type: Date
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'paused', 'completed', 'failed'],
      default: 'active'
    },
    intervalMinutes: {
      type: Number
    },
    priority: {
      type: Number,
      default: 5
    },
    params: {
      type: Schema.Types.Mixed
    },
    options: {
      type: Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

// Compound index for the hot path: "find due active jobs".
ScheduledJobSchema.index({ status: 1, nextRun: 1 });

export default (mongoose.models.ScheduledJob as mongoose.Model<IScheduledJob>) ||
  mongoose.model<IScheduledJob>('ScheduledJob', ScheduledJobSchema);
