import SellerEarning from '../models/SellerEarning';
import Payout from '../models/Payout';
import Product from '../models/Product';
import { Types } from 'mongoose';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { OrderDoc } from '../models/Order';

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function createSellerEarnings(order: OrderDoc) {
  const perSeller = new Map<string, { gross: number; commission: number; amount: number }>();

  for (const item of order.items) {
    const product = await Product.findById(item.product).select('seller');
    if (!product || !product.seller) continue;
    const sellerId = product.seller.toString();
    const gross = item.price * item.qty;
    const commission = roundMoney((gross * env.commissionRate) / 100);
    const amount = roundMoney(gross - commission);

    const current = perSeller.get(sellerId) ?? { gross: 0, commission: 0, amount: 0 };
    current.gross = roundMoney(current.gross + gross);
    current.commission = roundMoney(current.commission + commission);
    current.amount = roundMoney(current.amount + amount);
    perSeller.set(sellerId, current);
  }

  for (const [sellerId, data] of perSeller) {
    await SellerEarning.findOneAndUpdate(
      { order: order._id, seller: sellerId },
      {
        $setOnInsert: {
          order: order._id,
          orderNumber: order.orderNumber,
          seller: sellerId,
          gross: data.gross,
          commission: data.commission,
          amount: data.amount,
          status: 'pending',
        },
      },
      { upsert: true }
    );
  }
}

export async function markOrderEarningsAvailable(orderId: string) {
  await SellerEarning.updateMany(
    { order: orderId, status: 'pending' },
    { $set: { status: 'available' } }
  );
}

export async function getPayoutSummary(userId: string) {
  const rows = await SellerEarning.aggregate([
    { $match: { seller: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        total: { $sum: '$amount' },
      },
    },
  ]);

  const sums: Record<string, number> = {};
  for (const row of rows) sums[row._id] = Math.round(row.total * 100) / 100;

  const recentEarnings = await SellerEarning.find({ seller: userId })
    .sort({ createdAt: -1 })
    .limit(10);
  const payouts = await Payout.find({ seller: userId }).sort({ createdAt: -1 }).limit(10);

  return {
    pending: sums.pending ?? 0,
    available: sums.available ?? 0,
    processing: sums.processing ?? 0,
    paid: sums.paid ?? 0,
    recentEarnings,
    payouts,
  };
}

export async function requestPayout(userId: string, amount: number) {
  const summary = await getPayoutSummary(userId);
  if (amount > summary.available) {
    throw new ApiError(400, `Mavjud balans: ${summary.available.toLocaleString()} so'm`);
  }

  const payout = await Payout.create({ seller: userId, amount, status: 'pending' });

  await SellerEarning.updateMany(
    { seller: userId, status: 'available' },
    { $set: { status: 'processing', payout: payout._id } },
    { runValidators: true }
  );

  return payout;
}

export async function listPayouts(query: { status?: string; page?: number; limit?: number } = {}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;

  const [payouts, total] = await Promise.all([
    Payout.find(filter)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Payout.countDocuments(filter),
  ]);

  return { payouts, total, page, pages: Math.ceil(total / limit) };
}

export async function handlePayout(payoutId: string, status: 'paid' | 'rejected') {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw new ApiError(404, 'To\'lov so\'rovi topilmadi');
  if (payout.status !== 'pending') {
    throw new ApiError(400, 'Bu so\'rov allaqachon ko\'rib chiqilgan');
  }

  if (status === 'paid') {
    payout.status = 'paid';
    payout.paidAt = new Date();
    await payout.save();
    await SellerEarning.updateMany(
      { seller: payout.seller, payout: payout._id, status: 'processing' },
      { $set: { status: 'paid' } }
    );
  } else {
    payout.status = 'rejected';
    await payout.save();
    await SellerEarning.updateMany(
      { seller: payout.seller, payout: payout._id, status: 'processing' },
      { $set: { status: 'available', payout: null } }
    );
  }

  return payout;
}
