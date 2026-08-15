import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import User from '../src/models/User';
import Product from '../src/models/Product';
import Store from '../src/models/Store';
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
    name: 'Test User',
    email: `admin${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
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

async function seedProduct(categoryId: string, sellerId: string, overrides: Record<string, unknown> = {}) {
  return Product.create({
    seller: sellerId,
    category: categoryId,
    name: `Admin Mahsulot ${Math.random().toString(36).slice(2, 8)}`,
    price: 10000,
    stock: 5,
    isActive: true,
    ...overrides,
  });
}

async function setup() {
  const admin = await createUser({ role: UserRole.ADMIN });
  const adminToken = await loginAs(admin);
  const seller = await createUser({ role: UserRole.SELLER, isApproved: true });
  const sellerToken = await loginAs(seller);

  const catRes = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `AdminKot ${Date.now()}` });
  const categoryId = catRes.body.data.category._id;

  await Product.create({
    seller: seller._id,
    category: categoryId,
    name: 'Admin Nofaol Mahsulot',
    price: 20000,
    stock: 0,
    isActive: false,
  });

  const store = await Store.create({
    name: 'Admin Test Store',
    owner: seller._id,
  });

  return { adminToken, sellerToken, seller, store, categoryId };
}

describe('Admin panel kengaytirish', () => {
  beforeEach(async () => {
    await Store.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({ role: UserRole.CUSTOMER });
  });

  it('mahsulotlar/admin endpointi nofaol mahsulotlarni ham qaytaradi (faqat admin)', async () => {
    const { adminToken } = await setup();

    const res = await request(app)
      .get('/api/products/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.products[0].isActive).toBe(false);
  });

  it('mahsulotlar/admin ga xaridor kira olmaydi', async () => {
    const customer = await createUser();
    const token = await loginAs(customer);

    const res = await request(app)
      .get('/api/products/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('do\'konlar/admin har bir do\'kon uchun mahsulot sonini qaytaradi', async () => {
    const { adminToken, seller, store, categoryId } = await setup();
    await seedProduct(categoryId, seller._id);

    const res = await request(app)
      .get('/api/stores/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const found = res.body.data.stores.find(
      (s: { _id: unknown }) => s._id === store._id.toString()
    );
    expect(found).toBeTruthy();
    expect(found.productCount).toBe(2);
    expect(found.isActive).toBe(true);
  });

  it('admin do\'konni nofaol qilib, qayta faollashtira oladi', async () => {
    const { adminToken, store } = await setup();

    const off = await request(app)
      .patch(`/api/stores/${store._id}/active`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(off.status).toBe(200);
    expect(off.body.data.store.isActive).toBe(false);

    const on = await request(app)
      .patch(`/api/stores/${store._id}/active`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true });
    expect(on.body.data.store.isActive).toBe(true);
  });

  it('do\'kon holatini o\'zgartirishga seller ruxsati yo\'q', async () => {
    const { sellerToken, store } = await setup();

    const res = await request(app)
      .patch(`/api/stores/${store._id}/active`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(403);
  });
});
