import mongoose, { Schema, Document } from 'mongoose';

export interface ITokenBalance extends Document {
  user_id: string;
  balance: number;
  total_used: number;
}

const TokenBalanceSchema: Schema = new Schema({
  user_id: { type: String, required: true, unique: true },
  balance: { type: Number, default: 100000 },
  total_used: { type: Number, default: 0 },
}, { timestamps: true });

export const TokenBalance = mongoose.models.TokenBalance || mongoose.model<ITokenBalance>('TokenBalance', TokenBalanceSchema, 'token_balances');
