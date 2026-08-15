import { Schema, model, Types } from 'mongoose';
import { slugify } from '../utils/slugify';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    image: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.pre('validate', async function () {
  if (!this.isModified('name')) return;
  const base = slugify(this.name) || 'category';
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await model('Category').findOne({ slug, _id: { $ne: this._id } });
    if (!existing) break;
    slug = `${base}-${n}`;
    n += 1;
  }
  this.slug = slug;
});

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: Types.ObjectId | null;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const Category = model<ICategory>('Category', categorySchema);

export default Category;
