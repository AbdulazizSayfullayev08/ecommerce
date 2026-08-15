import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import User from '../src/models/User';
import Product from '../src/models/Product';
import Coupon from '../src/models/Coupon';
import Order from '../src/models/Order';
import { UserRole } from '../src/types';

vi.mock('../src/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

import { stripe } from '../src/lib/stripe';

const app = createApp();
const TEST_PASSWORD = 'TestParol123';

async function createUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    name: 'Checkout User',
    email: `checkout${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: TEST_PASSWORD,
    isVerified: true,
    ...overrides,
  });
}

async function loginAs(user: { email: string }) {
  const res = await request(app).post('/api/auth/login').send({
    email: user.email,
    password: TEST_PASSWORD,
  });
  return res.body.data.accessToken as string;
}

async function addAddress(token: string) {
  const res = await request(app)
    .post('/api/users/me/addresses')
    .set('Authorization', `Bearer ${token}`)
    .send({
      fullName: 'Aziz Testov',
      phone: '+998901234567',
      region: 'Toshkent',
      city: 'Toshkent',
      street: 'Chilonzor 12',
      zip: '100000',
    });
  return res.body.data.addresses[res.body.data.addresses.length - 1]._id as string;
}

async function setupProduct(price = 100000, stock = 10) {
  const admin = await createUser({ role: UserRole.ADMIN });
  const adminToken = await loginAs(admin);
  const catRes = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `CheckoutKot ${Date.now()}` });
  const categoryId = catRes.body.data.category._id;

  const seller = await createUser({ role: UserRole.SELLER, isApproved: true });
  const sellerToken = await loginAs(seller);
  const prodRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ category: categoryId, name: `Checkout Mahsulot ${Date.now()}`, price, stock });
  return prodRes.body.data.product;
}

async function setupCart(token: string, productId: string, qty = 2) {
  await request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId, qty });
}

describe('Checkout — COD', () => {
  it('to\'lov kutilmoqda holatida buyurtma yaratiladi, stock kamayadi, savat tozalanadi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const addressId = await addAddress(token);
    const product = await setupProduct(100000, 5);
    await setupCart(token, product._id, 2);

    const res = await request(app)
      .post('/api/checkout/cod')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId });

    expect(res.status).toBe(201);
    const order = res.body.data.order;
    expect(order.orderNumber).toMatch(/^ORD-/);
    expect(order.paymentMethod).toBe('cod');
    expect(order.paymentStatus).toBe('pending');
    expect(order.status).toBe('processing');
    expect(order.subtotal).toBe(200000);
    expect(order.total).toBe(200000);
    expect(order.address.fullName).toBe('Aziz Testov');
    expect(order.items[0].qty).toBe(2);

    const updated = await Product.findById(product._id);
    expect(updated!.stock).toBe(3);

    const cartRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);
    expect(cartRes.body.data.cart.items).toEqual([]);
  });

  it('manzilsiz buyurtma qilib bo\'lmaydi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const product = await setupProduct();
    await setupCart(token, product._id, 1);

    const res = await request(app)
      .post('/api/checkout/cod')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: '000000000000000000000000' });

    expect(res.status).toBe(400);
  });

  it('bo\'sh savat bilan buyurtma qilib bo\'lmaydi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const addressId = await addAddress(token);

    const res = await request(app)
      .post('/api/checkout/cod')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId });

    expect(res.status).toBe(400);
  });

  it('stock yetarli bo\'lmasa rad etiladi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const addressId = await addAddress(token);
    const product = await setupProduct(100000, 1);
    await setupCart(token, product._id, 1);
    await Product.findByIdAndUpdate(product._id, { stock: 0 });

    const res = await request(app)
      .post('/api/checkout/cod')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId });

    expect(res.status).toBe(400);
  });

  it('kupon qo\'llanilganda chegirma hisoblanadi va iste\'mol oshadi', async () => {
    const admin = await createUser({ role: UserRole.ADMIN });
    const adminToken = await loginAs(admin);
    await request(app)
      .post('/api/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'COD10', type: 'percentage', value: 10 });

    const user = await createUser();
    const token = await loginAs(user);
    const addressId = await addAddress(token);
    const product = await setupProduct(100000, 5);
    await setupCart(token, product._id, 2);
    await request(app)
      .post('/api/cart/coupon')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'COD10' });

    const res = await request(app)
      .post('/api/checkout/cod')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId });

    expect(res.status).toBe(201);
    expect(res.body.data.order.discount).toBe(20000);
    expect(res.body.data.order.total).toBe(180000);
    expect(res.body.data.order.couponCode).toBe('COD10');

    const coupon = await Coupon.findOne({ code: 'COD10' });
    expect(coupon!.usedCount).toBe(1);
  });

  it('tokensiz checkout qilib bo\'lmaydi', async () => {
    const res = await request(app)
      .post('/api/checkout/cod')
      .send({ addressId: 'abc' });
    expect(res.status).toBe(401);
  });
});

describe('Checkout — Stripe', () => {
  beforeEach(() => {
    vi.mocked(stripe!.checkout.sessions.create).mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    } as never);
  });

  it('session yaratiladi va buyurtma pending saqlanadi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const addressId = await addAddress(token);
    const product = await setupProduct(50000, 5);
    await setupCart(token, product._id, 3);

    const res = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId });

    expect(res.status).toBe(201);
    expect(res.body.data.url).toContain('checkout.stripe.com');
    expect(vi.mocked(stripe!.checkout.sessions.create)).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'payment' })
    );

    const order = await Order.findOne({ stripeSessionId: 'cs_test_123' });
    expect(order).not.toBeNull();
    expect(order!.paymentStatus).toBe('pending');
    expect(order!.status).toBe('pending');
    expect(order!.subtotal).toBe(150000);

    const updated = await Product.findById(product._id);
    expect(updated!.stock).toBe(5);
  });

  it('webhook session.completed da to\'lov tasdiqlanadi, stock kamayadi, savat tozalanadi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const addressId = await addAddress(token);
    const product = await setupProduct(50000, 5);
    await setupCart(token, product._id, 3);

    await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId });

    const webhookRes = await request(app)
      .post('/api/checkout/webhook')
      .send({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_123' } } });

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.received).toBe(true);

    const order = await Order.findOne({ stripeSessionId: 'cs_test_123' });
    expect(order!.paymentStatus).toBe('paid');
    expect(order!.status).toBe('processing');
    expect(order!.paidAt).not.toBeNull();

    const updated = await Product.findById(product._id);
    expect(updated!.stock).toBe(2);

    const cartRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);
    expect(cartRes.body.data.cart.items).toEqual([]);
  });

  it('noma\'lum session webhook e\'lon qilinadi, xato emas', async () => {
    const res = await request(app)
      .post('/api/checkout/webhook')
      .send({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_none' } } });
    expect(res.status).toBe(200);
  });
});
