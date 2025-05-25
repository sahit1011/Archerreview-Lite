import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the Alert document
export interface IAlert extends Document {
  user: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  type: 'MISSED_TASK' | 'LOW_PERFORMANCE' | 'SCHEDULE_DEVIATION' | 'TOPIC_DIFFICULTY' | 'STUDY_PATTERN' | 'GENERAL' | 'REMEDIATION' | 'SCHEDULE_CHANGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  relatedTask?: mongoose.Types.ObjectId;
  relatedTopic?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  isResolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Alert schema
const AlertSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'StudyPlan',
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['MISSED_TASK', 'LOW_PERFORMANCE', 'SCHEDULE_DEVIATION', 'TOPIC_DIFFICULTY', 'STUDY_PATTERN', 'GENERAL', 'REMEDIATION', 'SCHEDULE_CHANGE']
    },
    severity: {
      type: String,
      required: true,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM'
    },
    message: {
      type: String,
      required: true
    },
    relatedTask: {
      type: Schema.Types.ObjectId,
      ref: 'Task'
    },
    relatedTopic: {
      type: Schema.Types.ObjectId,
      ref: 'Topic'
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    isResolved: {
      type: Boolean,
      required: true,
      default: false
    },
    resolvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Create and export the Alert model
export default mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
