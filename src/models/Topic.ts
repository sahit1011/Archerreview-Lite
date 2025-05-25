import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the Topic document
export interface ITopic extends Document {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
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
      enum: [
        'MANAGEMENT_OF_CARE',
        'SAFETY_AND_INFECTION_CONTROL',
        'HEALTH_PROMOTION',
        'PSYCHOSOCIAL_INTEGRITY',
        'BASIC_CARE_AND_COMFORT',
        'PHARMACOLOGICAL_THERAPIES',
        'REDUCTION_OF_RISK_POTENTIAL',
        'PHYSIOLOGICAL_ADAPTATION'
      ]
    },
    subcategory: { type: String },
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
export default mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema);
