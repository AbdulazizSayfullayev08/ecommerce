import Order, { OrderDoc } from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import { ApiError } from '../utils/ApiError';
import { sendEmail } from '../utils/email';
import { formatPrice } from '../utils/formatPrice';

export interface OrderListQuery {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  q?: string;
}

function paginate(page = 1, limit = 10) {
  return { skip: (page - 1) * limit, limit };
}

export async function listMyOrders(userId: string, query: OrderListQuery = {}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const filter: Record<string, unknown> = { user: userId };
  if (query.status) filter.status = query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(paginate(page, limit).skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return { orders, total, page, pages: Math.ceil(total / limit) };
}

export async function getMyOrder(userId: string, orderId: string) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new ApiError(404, 'Buyurtma topilmadi');
  return order;
}

export async function listAdminOrders(query: OrderListQuery = {}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.q) filter.orderNumber = { $regex: query.q, $options: 'i' };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(paginate(page, limit).skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return { orders, total, page, pages: Math.ceil(total / limit) };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const order = await Order.findById(orderId).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Buyurtma topilmadi');

  order.status = status as OrderDoc['status'];
  if (status === 'cancelled' && order.paymentStatus === 'pending') {
    order.paymentStatus = 'failed';
  }
  await order.save();

  void sendOrderStatusEmail(order, status);
  return order;
}

export async function listSellerOrders(sellerId: string) {
  const products = await Product.find({ seller: sellerId }).select('_id');
  const productIds = products.map((p) => p._id);
  if (productIds.length === 0) return { orders: [] };

  const orders = await Order.find({ 'items.product': { $in: productIds } })
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });

  return { orders };
}

export async function sendOrderConfirmationEmail(order: OrderDoc) {
  const user = await User.findById(order.user).select('name email');
  if (!user) return;

  const itemsHtml = order.items
    .map(
      (it) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${it.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${it.qty}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${formatPrice(it.price * it.qty)}</td>
        </tr>`
    )
    .join('');

  await sendEmail({
    to: user.email,
    subject: `Buyurtma qabul qilindi: ${order.orderNumber}`,
    html: `
      <h2>Assalomu alaykum, ${user.name}!</h2>
      <p>Buyurtmangiz muvaffaqiyatli qabul qilindi.</p>
      <p><strong>Buyurtma raqami:</strong> ${order.orderNumber}</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Mahsulot</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Soni</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Summa</th></tr>
        ${itemsHtml}
      </table>
      <p>Mahsulotlar: <strong>${formatPrice(order.subtotal)}</strong></p>
      ${order.discount > 0 ? `<p>Chegirma: <strong>-${formatPrice(order.discount)}</strong></p>` : ''}
      <p>Jami: <strong>${formatPrice(order.total)}</strong></p>
      <p>To'lov usuli: ${order.paymentMethod === 'cod' ? 'Yetkazib berishda to\'lash' : 'Karta (Stripe)'}</p>
      <p>Yetkazib berish: ${order.address.region}, ${order.address.city}, ${order.address.street}</p>
    `,
  });
}

export async function sendOrderStatusEmail(order: OrderDoc, status: string) {
  const user = await User.findById(order.user).select('name email');
  if (!user) return;

  const statusText: Record<string, string> = {
    processing: 'Buyurtma tayyorlanmoqda',
    shipped: 'Buyurtma yuborildi',
    delivered: 'Buyurtma yetkazildi',
    cancelled: 'Buyurtma bekor qilindi',
    pending: 'Buyurtma kutilmoqda',
  };

  await sendEmail({
    to: user.email,
    subject: `${order.orderNumber}: ${statusText[status] ?? status}`,
    html: `
      <h2>Assalomu alaykum, ${user.name}!</h2>
      <p>Buyurtmangiz holati yangilandi.</p>
      <p><strong>Buyurtma raqami:</strong> ${order.orderNumber}</p>
      <p><strong>Holat:</strong> ${statusText[status] ?? status}</p>
      <p>Jami summa: ${formatPrice(order.total)}</p>
    `,
  });
}
