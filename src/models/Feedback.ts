import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface for Feedback document
 */
export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId;
  text: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  topics: string[];
  keyIssues: string[];
  suggestions: string[];
  praise: string[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  response: string;
  suggestedActions: Array<{
    type: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  llmEnhanced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema for Feedback
 */
const FeedbackSchema = new Schema<IFeedback>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    sentiment: {
      type: String,
      enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'],
      default: 'NEUTRAL'
    },
    topics: {
      type: [String],
      default: []
    },
    keyIssues: {
      type: [String],
      default: []
    },
    suggestions: {
      type: [String],
      default: []
    },
    praise: {
      type: [String],
      default: []
    },
    urgency: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM'
    },
    response: {
      type: String,
      default: ''
    },
    suggestedActions: {
      type: [{
        type: {
          type: String,
          required: true
        },
        description: {
          type: String,
          required: true
        },
        priority: {
          type: String,
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          default: 'MEDIUM'
        }
      }],
      default: []
    },
    llmEnhanced: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Create and export the model
const Feedback = mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);

export default Feedback;
