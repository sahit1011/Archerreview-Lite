import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the Task document
export interface ITask extends Document {
  plan: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: 'VIDEO' | 'QUIZ' | 'READING' | 'PRACTICE' | 'REVIEW' | 'OVERLOADED';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  startTime: Date;
  endTime: Date;
  originalStartTime?: Date; // Original start time from the scheduler
  originalEndTime?: Date; // Original end time from the scheduler
  duration: number; // in minutes
  content?: mongoose.Types.ObjectId;
  topic: mongoose.Types.ObjectId;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  confidence?: number; // 1-5 scale
  createdAt: Date;
  updatedAt: Date;
}

// Define the Task schema
const TaskSchema: Schema = new Schema(
  {
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'StudyPlan',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['VIDEO', 'QUIZ', 'READING', 'PRACTICE', 'REVIEW', 'OVERLOADED']
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
      default: 'PENDING'
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    originalStartTime: {
      type: Date
    },
    originalEndTime: {
      type: Date
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    },
    content: {
      type: Schema.Types.ObjectId,
      ref: 'Content'
    },
    topic: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: true
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM'
    },
    confidence: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  { timestamps: true }
);

// Create and export the Task model
export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
