import { Schema, model, Types } from 'mongoose';

export interface ICartItem {
  product: Types.ObjectId;
  qty: number;
}

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        qty: { type: Number, required: true, min: 1, default: 1 },
      },
    ],
    couponCode: { type: String, default: null },
  },
  { timestamps: true }
);

export interface ICart {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: ICartItem[];
  couponCode?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const Cart = model<ICart>('Cart', cartSchema);

export default Cart;
