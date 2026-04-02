import mongoose, { Model, Schema } from 'mongoose';

export interface ISession {
  title: string;
  model: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const sessionSchema = new Schema<ISession>({
  title: { type: String, default: 'New Chat' },
  model: { type: String, default: 'llama-3.3-70b-versatile' },
}, { timestamps: true });

export const Session = (mongoose.models.Session as Model<ISession>) || mongoose.model<ISession>('Session', sessionSchema);
