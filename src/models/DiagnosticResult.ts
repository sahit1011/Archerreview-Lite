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
      selectedOption: { type: Number, required: true },
      correctOption: { type: Number, required: true },
      isCorrect: { type: Boolean, required: true }
    }],
    weakAreas: [{ 
      type: String,
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
    }],
    recommendedFocus: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Topic'
    }]
  },
  { timestamps: true }
);

// Create and export the DiagnosticResult model
export default mongoose.models.DiagnosticResult || mongoose.model<IDiagnosticResult>('DiagnosticResult', DiagnosticResultSchema);
