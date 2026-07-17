import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the Topic document
export interface ITopic extends Document {
  name: string;
  description: string;
  category: string; // subject: PHYSICS | CHEMISTRY | BIOLOGY | MATHEMATICS
  subcategory?: string;
  examTypes: ('NEET' | 'JEE')[]; // which exams this topic belongs to
  prerequisites: mongoose.Types.ObjectId[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  importance: number; // 1-10 scale
  estimatedDuration: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

// Define the Topic schema
const TopicSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'MATHEMATICS']
    },
    subcategory: { type: String },
    examTypes: {
      type: [String],
      enum: ['NEET', 'JEE'],
      default: ['NEET', 'JEE']
    },
    prerequisites: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
    difficulty: { 
      type: String, 
      required: true, 
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM'
    },
    importance: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 10,
      default: 5
    },
    estimatedDuration: { 
      type: Number, 
      required: true,
      default: 30 // 30 minutes default
    }
  },
  { timestamps: true }
);

// Create and export the Topic model
export default (mongoose.models.Topic as mongoose.Model<ITopic>) || mongoose.model<ITopic>('Topic', TopicSchema);
