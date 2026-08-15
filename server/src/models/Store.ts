import { Schema, model, Types } from 'mongoose';
import { slugify } from '../utils/slugify';

const storeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: '' },
    logo: { type: String, default: null },
    banner: { type: String, default: null },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
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

storeSchema.pre('validate', async function () {
  if (!this.isModified('name')) return;
  const base = slugify(this.name) || 'store';
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await model('Store').findOne({ slug, _id: { $ne: this._id } });
    if (!existing) break;
    slug = `${base}-${n}`;
    n += 1;
  }
  this.slug = slug;
});

export interface IStore {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  banner: string | null;
  owner: Types.ObjectId;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type StoreDoc = IStore & {
  toObject(): IStore & { _id: Types.ObjectId };
};

const Store = model<IStore>('Store', storeSchema);

export default Store;
