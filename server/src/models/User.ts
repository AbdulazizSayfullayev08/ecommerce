import { Schema, model, Types, InferSchemaType } from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new Schema(
  {
    label: { type: String, default: 'Uy' },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    country: { type: String, default: 'O\'zbekiston' },
    region: { type: String, required: true },
    city: { type: String, required: true },
    street: { type: String, required: true },
    zip: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, trim: true },
    avatar: { type: String },
    role: {
      type: String,
      enum: ['customer', 'seller', 'admin'],
      default: 'customer',
    },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    addresses: { type: [addressSchema], default: [] },
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    resetToken: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
    refreshToken: { type: String, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.otp;
        delete ret.otpExpiresAt;
        delete ret.resetToken;
        delete ret.resetTokenExpiresAt;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export type UserAddress = InferSchemaType<typeof addressSchema> & {
  _id: Types.ObjectId;
};

export interface IUser {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  role: 'customer' | 'seller' | 'admin';
  storeId?: Types.ObjectId;
  isVerified: boolean;
  isApproved: boolean;
  isBlocked: boolean;
  addresses: UserAddress[];
  wishlist: Types.ObjectId[];
  otp?: string;
  otpExpiresAt?: Date;
  resetToken?: string;
  resetTokenExpiresAt?: Date;
  refreshToken?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserDoc = IUser & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const User = model<UserDoc>('User', userSchema);

export default User;
