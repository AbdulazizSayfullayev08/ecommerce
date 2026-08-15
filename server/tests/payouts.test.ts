import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import User from '../src/models/User';
import Product from '../src/models/Product';
import Order from '../src/models/Order';
import SellerEarning from '../src/models/SellerEarning';
import Payout from '../src/models/Payout';
import { UserRole } from '../src/types';

vi.mock('../src/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: { create: vi.fn() },
    },
    webhooks: { constructEvent: vi.fn() },
  },
}));

const app = createApp();
const TEST_PASSWORD = 'TestParol123';

async function createUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    name: 'Payout User',
    email: `payout${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
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

async function setupProduct(price = 100000, stock = 5) {
  const admin = await createUser({ role: UserRole.ADMIN });
  const adminToken = await loginAs(admin);
  const catRes = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `PayoutKot ${Date.now()}` });
  const categoryId = catRes.body.data.category._id;

  const seller = await createUser({ role: UserRole.SELLER, isApproved: true });
  const sellerToken = await loginAs(seller);
  const prodRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ category: categoryId, name: `Payout Mahsulot ${Date.now()}`, price, stock });
  return { product: prodRes.body.data.product, seller, admin, sellerToken, adminToken };
}

async function createOrder() {
  const user = await createUser();
  const token = await loginAs(user);
  const addressId = await addAddress(token);
  const { product, seller, admin, sellerToken, adminToken } = await setupProduct();
  await request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId: product._id, qty: 2 });

  const res = await request(app)
    .post('/api/checkout/cod')
    .set('Authorization', `Bearer ${token}`)
    .send({ addressId });

  const order = res.body.data.order;
  return { order, product, seller, admin, token, sellerToken, adminToken };
}

describe('Payout — komissiya', () => {
  beforeEach(async () => {
    await SellerEarning.deleteMany({});
    await Payout.deleteMany({});
  });

  it('buyurtma yaratilganda seller daromadi 5% komissiya bilan qayd etiladi', async () => {
    const { order, seller } = await createOrder();

    const earning = await SellerEarning.findOne({ order: order._id });
    expect(earning).not.toBeNull();
    expect(earning!.seller.toString()).toBe(seller._id.toString());
    expect(earning!.gross).toBe(200000);
    expect(earning!.commission).toBe(10000);
    expect(earning!.amount).toBe(190000);
    expect(earning!.status).toBe('pending');
  });

  it('buyurtma delivered bo\'lganda daromad available bo\'ladi', async () => {
    const { order, adminToken } = await createOrder();

    await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' });

    const earning = await SellerEarning.findOne({ order: order._id });
    expect(earning!.status).toBe('available');
  });

  it('seller summary mavjud balansni ko\'rsatadi', async () => {
    const { seller, adminToken, order } = await createOrder();
    await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' });

    const sellerToken = await loginAs(seller);
    const res = await request(app)
      .get('/api/payouts/summary')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(190000);
    expect(res.body.data.pending).toBe(0);
    expect(res.body.data.recentEarnings.length).toBe(1);
  });

  it('seller to\'lov so\'raydi, daromad processing bo\'ladi', async () => {
    const { seller, adminToken, order } = await createOrder();
    await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' });

    const sellerToken = await loginAs(seller);
    const res = await request(app)
      .post('/api/payouts')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ amount: 190000 });

    expect(res.status).toBe(201);
    expect(res.body.data.payout.status).toBe('pending');

    const earning = await SellerEarning.findOne({ order: order._id });
    expect(earning!.status).toBe('processing');
    expect(earning!.payout!.toString()).toBe(res.body.data.payout._id);
  });

  it('mavjud balansdan ko\'p so\'ralsa rad etiladi', async () => {
    const { seller, adminToken, order } = await createOrder();
    await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' });

    const sellerToken = await loginAs(seller);
    const res = await request(app)
      .post('/api/payouts')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ amount: 999999999 });

    expect(res.status).toBe(400);
  });

  it('admin to\'lovni ma\'qullaydi — daromad paid bo\'ladi', async () => {
    const { seller, adminToken, order } = await createOrder();
    await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' });

    const sellerToken = await loginAs(seller);
    const payout = (await request(app)
      .post('/api/payouts')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ amount: 190000 })).body.data.payout;

    const list = await request(app)
      .get('/api/payouts')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.body.data.total).toBe(1);

    const res = await request(app)
      .patch(`/api/payouts/${payout._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'paid' });

    expect(res.status).toBe(200);
    expect(res.body.data.payout.status).toBe('paid');

    const earning = await SellerEarning.findOne({ order: order._id });
    expect(earning!.status).toBe('paid');

    const summary = await request(app)
      .get('/api/payouts/summary')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(summary.body.data.available).toBe(0);
    expect(summary.body.data.paid).toBe(190000);
  });

  it('admin to\'lovni rad etsa — daromad available ga qaytadi', async () => {
    const { seller, adminToken, order } = await createOrder();
    await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' });

    const sellerToken = await loginAs(seller);
    const payout = (await request(app)
      .post('/api/payouts')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ amount: 190000 })).body.data.payout;

    const res = await request(app)
      .patch(`/api/payouts/${payout._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' });

    expect(res.status).toBe(200);
    expect(res.body.data.payout.status).toBe('rejected');

    const earning = await SellerEarning.findOne({ order: order._id });
    expect(earning!.status).toBe('available');
  });

  it('oddiy mijoz to\'lov so\'ray olmaydi', async () => {
    const user = await createUser();
    const token = await loginAs(user);

    const res = await request(app)
      .post('/api/payouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 10000 });

    expect(res.status).toBe(403);
  });
});
