import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the StudyPlan document
export interface IStudyPlan extends Document {
  user: mongoose.Types.ObjectId;
  examDate: Date;
  isPersonalized: boolean;
  startDate: Date;
  endDate: Date;
  currentVersion: number;
  lastReviewDate: Date;
  nextReviewDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define the StudyPlan schema
const StudyPlanSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    examDate: {
      type: Date,
      required: true
    },
    isPersonalized: {
      type: Boolean,
      default: false
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    currentVersion: {
      type: Number,
      default: 1
    },
    lastReviewDate: {
      type: Date,
      default: null
    },
    nextReviewDate: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Create and export the StudyPlan model
export default mongoose.models.StudyPlan || mongoose.model<IStudyPlan>('StudyPlan', StudyPlanSchema);
