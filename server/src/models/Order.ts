import { Schema, model, Types } from 'mongoose';

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    image: { type: String, default: null },
  },
  { _id: false }
);

const orderAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    country: { type: String, default: "O'zbekiston" },
    region: { type: String, required: true },
    city: { type: String, required: true },
    street: { type: String, required: true },
    zip: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, unique: true, required: true },
    items: { type: [orderItemSchema], required: true },
    address: { type: orderAddressSchema, required: true },
    paymentMethod: { type: String, enum: ['stripe', 'cod'], required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: null },
    shippingCost: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    stripeSessionId: { type: String, default: null, index: true },
    paidAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

orderSchema.pre('validate', function (this: { orderNumber?: string }) {
  if (!this.orderNumber) {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    this.orderNumber = `ORD-${stamp}-${rand}`;
  }
});

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  price: number;
  qty: number;
  image: string | null;
}

export interface IOrderAddress {
  fullName: string;
  phone: string;
  country: string;
  region: string;
  city: string;
  street: string;
  zip?: string;
}

export interface IOrder {
  user: Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  address: IOrderAddress;
  paymentMethod: 'stripe' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingCost: number;
  total: number;
  stripeSessionId: string | null;
  paidAt: Date | null;
}

export type OrderDoc = IOrder & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const Order = model<OrderDoc>('Order', orderSchema);

export default Order;
