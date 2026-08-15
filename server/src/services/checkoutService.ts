import Order, { IOrderItem } from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import { stripe } from '../lib/stripe';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { getCart } from './cartService';
import { incrementCouponUsage } from './couponService';
import { sendOrderConfirmationEmail } from './orderService';
import { createSellerEarnings } from './payoutService';

interface CartItemWithProduct {
  product: {
    _id: unknown;
    name: string;
    price: number;
    stock: number;
    images?: string[];
  };
  qty: number;
}

function toMinor(value: number): number {
  return Math.round(value * 100);
}

async function getAddress(userId: string, addressId: string) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');
  const address = user.addresses.find(
    (a) => a._id.toString() === addressId
  );
  if (!address) throw new ApiError(400, 'Manzil topilmadi');
  return { user, address };
}

async function snapshotItems(cartItems: CartItemWithProduct[]): Promise<IOrderItem[]> {
  const items: IOrderItem[] = [];
  for (const it of cartItems) {
    const product = it.product;
    if (product.stock < it.qty) {
      throw new ApiError(400, `"${product.name}" mahsuloti yetarli emas (omborda ${product.stock} dona)`);
    }
    items.push({
      product: product._id as IOrderItem['product'],
      name: product.name,
      price: product.price,
      qty: it.qty,
      image: product.images?.[0] ?? null,
    });
  }
  return items;
}

async function decrementStock(items: IOrderItem[]) {
  for (const it of items) {
    const updated = await Product.findByIdAndUpdate(
      it.product,
      { $inc: { stock: -it.qty } },
      { new: true }
    );
    if (!updated || updated.stock < 0) {
      throw new ApiError(400, `"${it.name}" mahsuloti omborda yetarli emas`);
    }
  }
}

async function clearUserCart(userId: string, couponCode: string | null) {
  const Cart = (await import('../models/Cart')).default;
  await Cart.updateOne({ user: userId }, { $set: { items: [], couponCode: null } });
  if (couponCode) {
    try {
      await incrementCouponUsage(couponCode);
    } catch {
      // kupon iste'moli muvaffaqiyatsiz bo'lsa ham buyurtma saqlanadi
    }
  }
}

export async function createStripeSession(userId: string, addressId: string) {
  if (!stripe) throw new ApiError(503, 'To\'lov tizimi sozlanmagan');

  const { address } = await getAddress(userId, addressId);
  const cartData = await getCart(userId);
  const cart = cartData.cart;

  if (cart.items.length === 0) {
    throw new ApiError(400, 'Savat bo\'sh');
  }

  const items = await snapshotItems(cart.items as CartItemWithProduct[]);
  const totals = cart.totals;
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: (await User.findById(userId))?.email,
    line_items: items.map((it) => ({
      quantity: it.qty,
      price_data: {
        currency: 'uzs',
        product_data: { name: it.name },
        unit_amount: toMinor(it.price),
      },
    })),
    metadata: {
      userId,
      orderNumber,
    },
    success_url: `${env.clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.clientUrl}/cart`,
  });

  const order = await Order.create({
    user: userId,
    orderNumber,
    items,
    address: {
      fullName: address.fullName,
      phone: address.phone,
      country: address.country,
      region: address.region,
      city: address.city,
      street: address.street,
      zip: address.zip ?? '',
    },
    paymentMethod: 'stripe',
    paymentStatus: 'pending',
    status: 'pending',
    subtotal: totals.subtotal,
    discount: totals.discount,
    couponCode: cart.couponCode,
    shippingCost: 0,
    total: totals.total,
    stripeSessionId: session.id,
  });

  return { url: session.url ?? `${env.clientUrl}/cart`, orderNumber: order.orderNumber };
}

export async function createCodOrder(userId: string, addressId: string) {
  const { address } = await getAddress(userId, addressId);
  const cartData = await getCart(userId);
  const cart = cartData.cart;

  if (cart.items.length === 0) {
    throw new ApiError(400, 'Savat bo\'sh');
  }

  const items = await snapshotItems(cart.items as CartItemWithProduct[]);
  const totals = cart.totals;

  await decrementStock(items);

  const order = await Order.create({
    user: userId,
    items,
    address: {
      fullName: address.fullName,
      phone: address.phone,
      country: address.country,
      region: address.region,
      city: address.city,
      street: address.street,
      zip: address.zip ?? '',
    },
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'processing',
    subtotal: totals.subtotal,
    discount: totals.discount,
    couponCode: cart.couponCode,
    shippingCost: 0,
    total: totals.total,
  });

  await clearUserCart(userId, cart.couponCode);

  await createSellerEarnings(order);
  void sendOrderConfirmationEmail(order).catch(() => undefined);
  return order;
}

export async function handleCheckoutSessionCompleted(sessionId: string) {
  const order = await Order.findOne({ stripeSessionId: sessionId });
  if (!order) return;
  if (order.paymentStatus === 'paid') return;

  await decrementStock(order.items);
  order.paymentStatus = 'paid';
  order.status = 'processing';
  order.paidAt = new Date();
  await order.save();

  await clearUserCart(order.user.toString(), order.couponCode);

  await createSellerEarnings(order);
  void sendOrderConfirmationEmail(order).catch(() => undefined);
}
