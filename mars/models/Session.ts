import mongoose, { Model, Schema } from 'mongoose';

export interface ISession {
  userId: string;       // Firebase UID — owner of this session
  title: string;
  model: string;
  createdAt?: Date;
  updatedAt?: Date;
  isPinned?: boolean;
  isDeleted?: boolean;
}

const sessionSchema = new Schema<ISession>({
  userId: { type: String, required: true, index: true },
  title: { type: String, default: 'New Chat' },
  model: { type: String, default: 'llama-3.3-70b-versatile' },
  isPinned: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export const Session = (mongoose.models.Session as Model<ISession>) || mongoose.model<ISession>('Session', sessionSchema);
