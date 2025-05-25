import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the Content document
export interface IContent extends Document {
  title: string;
  description: string;
  type: 'VIDEO' | 'QUIZ' | 'READING' | 'PRACTICE';
  topic: mongoose.Types.ObjectId;
  duration: number; // in minutes
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  url?: string; // For videos, readings
  content?: string; // For readings, HTML content
  questions?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[]; // For quizzes
  createdAt: Date;
  updatedAt: Date;
}

// Define the Content schema
const ContentSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { 
      type: String, 
      required: true,
      enum: ['VIDEO', 'QUIZ', 'READING', 'PRACTICE']
    },
    topic: { 
      type: Schema.Types.ObjectId, 
      ref: 'Topic',
      required: true
    },
    duration: { 
      type: Number, 
      required: true,
      min: 1
    },
    difficulty: { 
      type: String, 
      required: true, 
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM'
    },
    url: { type: String },
    content: { type: String },
    questions: [{
      question: { type: String, required: true },
      options: { type: [String], required: true },
      correctAnswer: { type: Number, required: true },
      explanation: { type: String, required: true }
    }]
  },
  { timestamps: true }
);

// Create and export the Content model
export default mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);
