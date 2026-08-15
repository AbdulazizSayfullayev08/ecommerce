import { Schema, model, Types } from 'mongoose';

const sellerEarningSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNumber: { type: String, required: true },
    gross: { type: Number, required: true, min: 0 },
    commission: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'available', 'processing', 'paid'],
      default: 'pending',
      index: true,
    },
    payout: { type: Schema.Types.ObjectId, ref: 'Payout', default: null },
  },
  { timestamps: true }
);

sellerEarningSchema.index({ seller: 1, status: 1 });
sellerEarningSchema.index({ order: 1, seller: 1 }, { unique: true });

export interface ISellerEarning {
  _id: Types.ObjectId;
  seller: Types.ObjectId;
  order: Types.ObjectId;
  orderNumber: string;
  gross: number;
  commission: number;
  amount: number;
  status: 'pending' | 'available' | 'processing' | 'paid';
  payout: Types.ObjectId | null;
  createdAt: Date;
}

const SellerEarning = model<ISellerEarning>('SellerEarning', sellerEarningSchema);

export default SellerEarning;
