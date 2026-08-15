import { Schema, model, Types } from 'mongoose';
import { slugify } from '../utils/slugify';

const productSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    brand: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, trim: true },
    images: { type: [String], default: [] },
    attributes: { type: Map, of: String, default: {} },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

productSchema.pre('validate', async function () {
  if (!this.isModified('name')) return;
  const base = slugify(this.name) || 'product';
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await model('Product').findOne({ slug, _id: { $ne: this._id } });
    if (!existing) break;
    slug = `${base}-${n}`;
    n += 1;
  }
  this.slug = slug;
});

export interface IProduct {
  _id: Types.ObjectId;
  seller: Types.ObjectId;
  category: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku?: string;
  images: string[];
  attributes: Map<string, string>;
  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const Product = model<IProduct>('Product', productSchema);

export default Product;
