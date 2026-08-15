import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import User from '../src/models/User';
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
    name: 'Stats User',
    email: `stats${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
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
    .send({ name: `StatsKot ${Date.now()}` });
  const categoryId = catRes.body.data.category._id;

  const seller = await createUser({ role: UserRole.SELLER, isApproved: true });
  const sellerToken = await loginAs(seller);
  const prodRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ category: categoryId, name: `Stats Mahsulot ${Date.now()}`, price, stock });
  return { product: prodRes.body.data.product, seller, admin, adminToken, sellerToken };
}

async function createDeliveredOrder() {
  const user = await createUser();
  const token = await loginAs(user);
  const addressId = await addAddress(token);
  const { product, seller, adminToken } = await setupProduct();
  await request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId: product._id, qty: 2 });

  const res = await request(app)
    .post('/api/checkout/cod')
    .set('Authorization', `Bearer ${token}`)
    .send({ addressId });

  const order = res.body.data.order;
  await request(app)
    .patch(`/api/orders/${order._id}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'delivered' });
  return { order, seller, adminToken };
}

describe('Statistika', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('seller statistika sotuvlar, daromad va top mahsulotlarni ko\'rsatadi', async () => {
    const { seller } = await createDeliveredOrder();

    const sellerToken = await loginAs(seller);
    const res = await request(app)
      .get('/api/stats/seller')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.revenue).toBe(200000);
    expect(res.body.data.itemsSold).toBe(2);
    expect(res.body.data.orders).toBe(1);
    expect(res.body.data.topProducts.length).toBe(1);
    expect(res.body.data.topProducts[0].revenue).toBe(200000);
    expect(res.body.data.monthly.length).toBeGreaterThanOrEqual(1);
  });

  it('delivered bo\'lmagan buyurtmalar statistikaga kirmaydi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const addressId = await addAddress(token);
    const { product, seller } = await setupProduct();
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 1 });
    await request(app)
      .post('/api/checkout/cod')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId });

    const sellerToken = await loginAs(seller);
    const res = await request(app)
      .get('/api/stats/seller')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.body.data.revenue).toBe(0);
    expect(res.body.data.orders).toBe(0);
  });

  it('admin statistika umumiy ko\'rsatkichlarni qaytaradi', async () => {
    await createDeliveredOrder();

    const admin = await createUser({ role: UserRole.ADMIN });
    const adminToken = await loginAs(admin);
    const res = await request(app)
      .get('/api/stats/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.revenue).toBe(200000);
    expect(res.body.data.deliveredOrders).toBe(1);
    expect(res.body.data.sellers).toBeGreaterThanOrEqual(1);
    expect(res.body.data.products).toBeGreaterThanOrEqual(1);
    expect(res.body.data.topSellers.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.monthly.length).toBeGreaterThanOrEqual(1);
  });

  it('oddiy mijoz statistika ko\'ra olmaydi', async () => {
    const user = await createUser();
    const token = await loginAs(user);

    const res = await request(app)
      .get('/api/stats/seller')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
