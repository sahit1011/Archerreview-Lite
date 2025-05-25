import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the Message
interface IMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

// Define the interface for the Conversation document
export interface IConversation extends Document {
  id: string;
  user?: mongoose.Types.ObjectId;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Define the Message schema
const MessageSchema: Schema = new Schema({
  id: { type: String, required: true },
  content: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },
  timestamp: { type: Date, required: true }
});

// Define the Conversation schema
const ConversationSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    title: { type: String, required: true },
    lastMessage: { type: String, default: '' },
    timestamp: { type: Date, required: true },
    messages: [MessageSchema]
  },
  { timestamps: true }
);

// Create and export the Conversation model
export default mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
