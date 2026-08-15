import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import User from '../src/models/User';
import Product from '../src/models/Product';
import Wishlist from '../src/models/Wishlist';
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
    name: 'Wishlist User',
    email: `wish${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
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

async function setupProduct() {
  const admin = await createUser({ role: UserRole.ADMIN });
  const adminToken = await loginAs(admin);
  const catRes = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `WishKot ${Date.now()}` });
  const categoryId = catRes.body.data.category._id;

  const seller = await createUser({ role: UserRole.SELLER, isApproved: true });
  const sellerToken = await loginAs(seller);
  const prodRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ category: categoryId, name: `Wish Mahsulot ${Date.now()}`, price: 50000, stock: 5 });
  return prodRes.body.data.product;
}

describe('Sevimlilar (wishlist)', () => {
  beforeEach(async () => {
    await Wishlist.deleteMany({});
    await Product.deleteMany({});
  });

  it('foydalanuvchi mahsulotni sevimlilarga qo\'shadi', async () => {
    const product = await setupProduct();
    const user = await createUser();
    const token = await loginAs(user);

    const res = await request(app)
      .post('/api/wishlist/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id });

    expect(res.status).toBe(200);
    expect(res.body.data.added).toBe(true);

    const list = await request(app).get('/api/wishlist').set('Authorization', `Bearer ${token}`);
    expect(list.body.data.total).toBe(1);
    expect(list.body.data.items[0].name).toBe(product.name);
  });

  it('takror qo\'shish xatolik bermaydi (idempotent)', async () => {
    const product = await setupProduct();
    const user = await createUser();
    const token = await loginAs(user);

    await request(app)
      .post('/api/wishlist/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id });
    const res = await request(app)
      .post('/api/wishlist/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id });

    expect(res.status).toBe(200);

    const list = await request(app).get('/api/wishlist').set('Authorization', `Bearer ${token}`);
    expect(list.body.data.total).toBe(1);
  });

  it('ids endpointi qo\'shilgan mahsulotlarni qaytaradi', async () => {
    const product = await setupProduct();
    const user = await createUser();
    const token = await loginAs(user);

    await request(app)
      .post('/api/wishlist/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id });

    const res = await request(app).get('/api/wishlist/ids').set('Authorization', `Bearer ${token}`);
    expect(res.body.data.ids).toContain(product._id);
  });

  it('mahsulotni sevimlilardan olib tashlash mumkin', async () => {
    const product = await setupProduct();
    const user = await createUser();
    const token = await loginAs(user);

    await request(app)
      .post('/api/wishlist/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id });

    const res = await request(app)
      .delete(`/api/wishlist/items/${product._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.added).toBe(false);

    const list = await request(app).get('/api/wishlist').set('Authorization', `Bearer ${token}`);
    expect(list.body.data.total).toBe(0);
  });

  it('butun ro\'yxatni tozalash mumkin', async () => {
    const product1 = await setupProduct();
    const product2 = await setupProduct();
    const user = await createUser();
    const token = await loginAs(user);

    for (const p of [product1, product2]) {
      await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: p._id });
    }

    const res = await request(app).delete('/api/wishlist').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const list = await request(app).get('/api/wishlist').set('Authorization', `Bearer ${token}`);
    expect(list.body.data.total).toBe(0);
  });

  it('tokensiz sevimlilarga kirib bo\'lmaydi', async () => {
    const res = await request(app).get('/api/wishlist');
    expect(res.status).toBe(401);
  });
});
