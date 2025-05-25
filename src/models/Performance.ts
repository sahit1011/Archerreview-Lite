import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the Performance document
export interface IPerformance extends Document {
  user: mongoose.Types.ObjectId;
  task: mongoose.Types.ObjectId;
  content?: mongoose.Types.ObjectId;
  topic: mongoose.Types.ObjectId;
  score?: number; // For quizzes (percentage)
  timeSpent: number; // in minutes
  completed: boolean;
  confidence: number; // 1-5 scale
  answers?: {
    questionIndex: number;
    selectedOption: number;
    isCorrect: boolean;
    timeSpent: number; // in seconds
  }[]; // For quizzes
  createdAt: Date;
  updatedAt: Date;
}

// Define the Performance schema
const PerformanceSchema: Schema = new Schema(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    task: { 
      type: Schema.Types.ObjectId, 
      ref: 'Task',
      required: true
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
    score: { 
      type: Number, 
      min: 0, 
      max: 100
    },
    timeSpent: { 
      type: Number, 
      required: true,
      min: 0
    },
    completed: { 
      type: Boolean, 
      required: true,
      default: false
    },
    confidence: { 
      type: Number, 
      required: true,
      min: 1, 
      max: 5
    },
    answers: [{
      questionIndex: { type: Number, required: true },
      selectedOption: { type: Number, required: true },
      isCorrect: { type: Boolean, required: true },
      timeSpent: { type: Number, required: true } // in seconds
    }]
  },
  { timestamps: true }
);

// Create and export the Performance model
export default mongoose.models.Performance || mongoose.model<IPerformance>('Performance', PerformanceSchema);
