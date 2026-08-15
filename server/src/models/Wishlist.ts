import { Schema, model, Types } from 'mongoose';

const wishlistItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const wishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [wishlistItemSchema], default: [] },
  },
  { timestamps: true }
);

export interface IWishlistItem {
  product: Types.ObjectId;
  addedAt: Date;
}

export interface IWishlist {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
}

const Wishlist = model<IWishlist>('Wishlist', wishlistSchema);

export default Wishlist;
