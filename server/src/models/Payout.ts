import { Schema, model, Types } from 'mongoose';

const payoutSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'rejected'],
      default: 'pending',
      index: true,
    },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export interface IPayout {
  _id: Types.ObjectId;
  seller: Types.ObjectId;
  amount: number;
  status: 'pending' | 'paid' | 'rejected';
  paidAt: Date | null;
  createdAt: Date;
}

const Payout = model<IPayout>('Payout', payoutSchema);

export default Payout;
