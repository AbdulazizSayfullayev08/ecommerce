import Order from '../models/Order';
import User from '../models/User';
import Product from '../models/Product';
import Store from '../models/Store';
import Payout from '../models/Payout';
import { Types } from 'mongoose';

function sixMonthsAgo(): Date {
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  return since;
}

async function sellerMonthly(sellerId: Types.ObjectId) {
  const rows = await Order.aggregate([
    { $match: { status: 'delivered', createdAt: { $gte: sixMonthsAgo() } } },
    { $unwind: '$items' },
    { $match: { 'items.seller': sellerId } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ month: r._id as string, revenue: Math.round(r.revenue) }));
}

async function adminMonthly() {
  const rows = await Order.aggregate([
    { $match: { status: 'delivered', createdAt: { $gte: sixMonthsAgo() } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ month: r._id as string, revenue: Math.round(r.revenue) }));
}

export async function getSellerStats(userId: string) {
  const sellerId = new Types.ObjectId(userId);

  const [overview, topProducts, monthly, payouts] = await Promise.all([
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
          itemsSold: { $sum: '$items.qty' },
          orders: { $addToSet: '$_id' },
        },
      },
    ]),
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          qty: { $sum: '$items.qty' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ]),
    sellerMonthly(sellerId),
    Payout.aggregate([
      { $match: { seller: sellerId, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const o = overview[0];
  return {
    revenue: o?.revenue ? Math.round(o.revenue) : 0,
    itemsSold: o?.itemsSold ?? 0,
    orders: o?.orders?.length ?? 0,
    paidPayouts: payouts[0]?.total ? Math.round(payouts[0].total) : 0,
    topProducts: topProducts.map((p) => ({
      name: p.name as string,
      qty: p.qty as number,
      revenue: Math.round(p.revenue as number),
    })),
    monthly,
  };
}

export async function getAdminStats() {
  const [revenue, totals, topSellers, monthly, pendingPayouts] = await Promise.all([
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'seller' }),
      Product.countDocuments({}),
      Store.countDocuments({}),
      Order.countDocuments({}),
    ]),
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.seller',
          revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
          orders: { $addToSet: '$_id' },
          itemsSold: { $sum: '$items.qty' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' } },
      {
        $project: {
          name: { $arrayElemAt: ['$seller.name', 0] },
          revenue: 1,
          orders: { $size: '$orders' },
          itemsSold: 1,
        },
      },
    ]),
    adminMonthly(),
    Payout.countDocuments({ status: 'pending' }),
  ]);

  return {
    revenue: revenue[0]?.revenue ? Math.round(revenue[0].revenue) : 0,
    deliveredOrders: revenue[0]?.orders ?? 0,
    users: totals[0],
    sellers: totals[1],
    products: totals[2],
    stores: totals[3],
    orders: totals[4],
    pendingPayouts,
    topSellers: topSellers.map((s) => ({
      name: (s.name as string) ?? 'Noma\'lum',
      revenue: Math.round(s.revenue as number),
      orders: s.orders as number,
      itemsSold: s.itemsSold as number,
    })),
    monthly,
  };
}
