import mongoose, { Schema, Document } from 'mongoose';

/**
 * Note — the student's personal digital notebook.
 *
 * Notes are created two ways:
 *  - TUTOR_SESSION: distilled automatically from an AI tutor conversation
 *    ("Save key points to My Notes") — the important discussion points for a
 *    topic, kept so the student can revise them later.
 *  - MANUAL: written/edited by the student.
 *
 * `content` is markdown (bullet lists render in the Notes UI). `topic` links
 * the note to a syllabus topic so it surfaces on focus areas and feeds the
 * topic tutor's memory context.
 */
export interface INote extends Document {
  user: mongoose.Types.ObjectId;
  topic?: mongoose.Types.ObjectId;
  subject?: 'PHYSICS' | 'CHEMISTRY' | 'BIOLOGY' | 'MATHEMATICS';
  title: string;
  content: string;
  source: 'TUTOR_SESSION' | 'MANUAL';
  conversationId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: Schema.Types.ObjectId, ref: 'Topic' },
    subject: {
      type: String,
      enum: ['PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'MATHEMATICS'],
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 20000 },
    source: { type: String, enum: ['TUTOR_SESSION', 'MANUAL'], default: 'MANUAL' },
    conversationId: { type: String },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

NoteSchema.index({ user: 1, topic: 1 });
NoteSchema.index({ user: 1, subject: 1, updatedAt: -1 });

export default (mongoose.models.Note as mongoose.Model<INote>) ||
  mongoose.model<INote>('Note', NoteSchema);
