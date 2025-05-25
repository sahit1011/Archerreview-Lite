import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the ReadinessScore document
export interface IReadinessScore extends Document {
  user: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  overallScore: number; // 0-100 percentage
  categoryScores: {
    category: string;
    score: number; // 0-100 percentage
  }[];
  weakAreas: mongoose.Types.ObjectId[]; // Topic IDs
  strongAreas: mongoose.Types.ObjectId[]; // Topic IDs
  projectedScore: number; // 0-100 percentage (predicted exam score)
  createdAt: Date;
  updatedAt: Date;
}

// Define the ReadinessScore schema
const ReadinessScoreSchema: Schema = new Schema(
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
    overallScore: { 
      type: Number, 
      required: true,
      min: 0, 
      max: 100
    },
    categoryScores: [{
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
      score: { 
        type: Number, 
        required: true,
        min: 0, 
        max: 100
      }
    }],
    weakAreas: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Topic'
    }],
    strongAreas: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Topic'
    }],
    projectedScore: { 
      type: Number, 
      required: true,
      min: 0, 
      max: 100
    }
  },
  { timestamps: true }
);

// Create and export the ReadinessScore model
export default mongoose.models.ReadinessScore || mongoose.model<IReadinessScore>('ReadinessScore', ReadinessScoreSchema);
