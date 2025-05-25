import mongoose, { Schema, Document } from 'mongoose';

export interface ITrendAnalysis extends Document {
  user: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  period: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  startDate: Date;
  endDate: Date;
  metrics: {
    averagePerformance: number;
    completionRate: number;
    topicMasteryProgress: Record<string, number>;
    consistencyScore: number;
    difficultyProgression: number;
    timeManagementScore: number;
  };
  trends: {
    performanceTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    completionTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    consistencyTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    difficultyTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  };
  anomalies: Array<{
    type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    detectedAt: Date;
  }>;
  insights: Array<{
    type: string;
    description: string;
    recommendation: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TrendAnalysisSchema: Schema = new Schema(
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
    period: {
      type: String,
      enum: ['WEEKLY', 'MONTHLY', 'QUARTERLY'],
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    metrics: {
      averagePerformance: Number,
      completionRate: Number,
      topicMasteryProgress: Schema.Types.Mixed,
      consistencyScore: Number,
      difficultyProgression: Number,
      timeManagementScore: Number
    },
    trends: {
      performanceTrend: {
        type: String,
        enum: ['IMPROVING', 'DECLINING', 'STABLE']
      },
      completionTrend: {
        type: String,
        enum: ['IMPROVING', 'DECLINING', 'STABLE']
      },
      consistencyTrend: {
        type: String,
        enum: ['IMPROVING', 'DECLINING', 'STABLE']
      },
      difficultyTrend: {
        type: String,
        enum: ['IMPROVING', 'DECLINING', 'STABLE']
      }
    },
    anomalies: [{
      type: {
        type: String
      },
      description: String,
      severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH']
      },
      detectedAt: Date
    }],
    insights: [{
      type: {
        type: String
      },
      description: String,
      recommendation: String,
      priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH']
      }
    }]
  },
  { timestamps: true }
);

export default mongoose.models.TrendAnalysis ||
  mongoose.model<ITrendAnalysis>('TrendAnalysis', TrendAnalysisSchema);
