import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the Adaptation document
export interface IAdaptation extends Document {
  user: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  type: 'RESCHEDULE' | 'DIFFICULTY_ADJUSTMENT' | 'CONTENT_ADDITION' | 'PLAN_REBALANCE' | 'REMEDIAL_CONTENT';
  description: string;
  reason: string;
  task?: mongoose.Types.ObjectId;
  topic?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Adaptation schema
const AdaptationSchema: Schema = new Schema(
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
      enum: [
        'RESCHEDULE',
        'DIFFICULTY_ADJUSTMENT',
        'CONTENT_ADDITION',
        'PLAN_REBALANCE',
        'REMEDIAL_CONTENT'
      ]
    },
    description: { 
      type: String, 
      required: true
    },
    reason: { 
      type: String, 
      required: true
    },
    task: { 
      type: Schema.Types.ObjectId, 
      ref: 'Task'
    },
    topic: { 
      type: Schema.Types.ObjectId, 
      ref: 'Topic'
    },
    metadata: {
      type: Object
    }
  },
  { timestamps: true }
);

// Create and export the Adaptation model
export default mongoose.models.Adaptation || mongoose.model<IAdaptation>('Adaptation', AdaptationSchema);
