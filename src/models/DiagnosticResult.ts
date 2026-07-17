import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the DiagnosticResult document
export interface IDiagnosticResult extends Document {
  user: mongoose.Types.ObjectId;
  completed: boolean;
  skipped: boolean;
  score: number; // 0-100 percentage
  categoryScores: {
    category: string;
    score: number; // 0-100 percentage
  }[];
  topicScores: {
    topic: mongoose.Types.ObjectId;
    topicName: string;
    category: string;
    score: number; // 0-100 percentage
  }[];
  answers: {
    question: string;
    topic: mongoose.Types.ObjectId;
    category: string;
    selectedOption: number;
    correctOption: number;
    isCorrect: boolean;
  }[];
  weakAreas: string[]; // Categories
  recommendedFocus: mongoose.Types.ObjectId[]; // Topic IDs
  createdAt: Date;
  updatedAt: Date;
}

// Define the DiagnosticResult schema
const DiagnosticResultSchema: Schema = new Schema(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    completed: { 
      type: Boolean, 
      required: true,
      default: false
    },
    skipped: { 
      type: Boolean, 
      required: true,
      default: false
    },
    score: { 
      type: Number, 
      min: 0, 
      max: 100
    },
    categoryScores: [{
      category: { 
        type: String, 
        required: true,
        enum: [
          'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'MATHEMATICS'
        ]
      },
      score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      }
    }],
    // Finer-grained per-topic scores (content-backed diagnostic). Optional so legacy
    // category-only results and the hardcoded fallback set still save cleanly.
    topicScores: [{
      topic: {
        type: Schema.Types.ObjectId,
        ref: 'Topic',
        required: true
      },
      topicName: { type: String },
      category: { type: String },
      score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      }
    }],
    answers: [{
      question: { type: String, required: true },
      topic: { 
        type: Schema.Types.ObjectId, 
        ref: 'Topic',
        required: true
      },
      category: { 
        type: String, 
        required: true,
        enum: [
          'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'MATHEMATICS'
        ]
      },
      selectedOption: { type: Number, required: true },
      correctOption: { type: Number, required: true },
      isCorrect: { type: Boolean, required: true }
    }],
    weakAreas: [{ 
      type: String,
      enum: [
        'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'MATHEMATICS'
      ]
    }],
    recommendedFocus: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Topic'
    }]
  },
  { timestamps: true }
);

// Create and export the DiagnosticResult model
export default (mongoose.models.DiagnosticResult as mongoose.Model<IDiagnosticResult>) || mongoose.model<IDiagnosticResult>('DiagnosticResult', DiagnosticResultSchema);
