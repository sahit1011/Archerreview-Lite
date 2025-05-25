import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the PlanVersion document
export interface IPlanVersion extends Document {
  user: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  versionNumber: number;
  createdAt: Date;
  reason: string;
  description: string;
  changes: {
    type: 'TASK_ADDED' | 'TASK_REMOVED' | 'TASK_MODIFIED' | 'DIFFICULTY_ADJUSTED' | 'SCHEDULE_REBALANCED' | 'REVIEW_ADDED';
    description: string;
    taskId?: mongoose.Types.ObjectId;
    topicId?: mongoose.Types.ObjectId;
    metadata?: Record<string, any>;
  }[];
  metrics: {
    taskCount: number;
    averageDifficulty: number;
    topicCoverage: number;
    reviewFrequency: number;
    workloadBalance: number;
  };
  isActive: boolean;
  createdBy: 'USER' | 'ADAPTATION_AGENT' | 'EVOLUTION_AGENT';
  updatedAt: Date;
}

// Define the PlanVersion schema
const PlanVersionSchema: Schema = new Schema(
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
    versionNumber: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    changes: [{
      type: {
        type: String,
        enum: ['TASK_ADDED', 'TASK_REMOVED', 'TASK_MODIFIED', 'DIFFICULTY_ADJUSTED', 'SCHEDULE_REBALANCED', 'REVIEW_ADDED'],
        required: true
      },
      description: {
        type: String,
        required: true
      },
      taskId: {
        type: Schema.Types.ObjectId,
        ref: 'Task'
      },
      topicId: {
        type: Schema.Types.ObjectId,
        ref: 'Topic'
      },
      metadata: {
        type: Schema.Types.Mixed
      }
    }],
    metrics: {
      taskCount: {
        type: Number,
        required: true
      },
      averageDifficulty: {
        type: Number,
        required: true
      },
      topicCoverage: {
        type: Number,
        required: true
      },
      reviewFrequency: {
        type: Number,
        required: true
      },
      workloadBalance: {
        type: Number,
        required: true
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: String,
      enum: ['USER', 'ADAPTATION_AGENT', 'EVOLUTION_AGENT'],
      required: true
    }
  },
  { timestamps: true }
);

// Create and export the PlanVersion model
export default mongoose.models.PlanVersion || 
  mongoose.model<IPlanVersion>('PlanVersion', PlanVersionSchema);
