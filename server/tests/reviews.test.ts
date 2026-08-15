import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import User from '../src/models/User';
import Product from '../src/models/Product';
import Review from '../src/models/Review';
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
    name: 'Review User',
    email: `review${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
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
    .send({ name: `ReviewKot ${Date.now()}` });
  const categoryId = catRes.body.data.category._id;

  const seller = await createUser({ role: UserRole.SELLER, isApproved: true });
  const sellerToken = await loginAs(seller);
  const prodRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ category: categoryId, name: `Review Mahsulot ${Date.now()}`, price: 50000, stock: 5 });
  return prodRes.body.data.product;
}

describe('Sharh va reytinglar', () => {
  beforeEach(async () => {
    await Review.deleteMany({});
    await Product.deleteMany({});
  });

  it('foydalanuvchi sharh qoldiradi, reyting yangilanadi', async () => {
    const product = await setupProduct();
    const user = await createUser();
    const token = await loginAs(user);

    const res = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, comment: 'Ajoyib mahsulot!' });

    expect(res.status).toBe(201);
    expect(res.body.data.review.rating).toBe(5);

    const updated = await Product.findById(product._id);
    expect(updated!.averageRating).toBe(5);
    expect(updated!.ratingCount).toBe(1);
  });

  it('bitta foydalanuvchi ikki marta sharh qoldirolmaydi', async () => {
    const product = await setupProduct();
    const user = await createUser();
    const token = await loginAs(user);

    await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5 });

    const res = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4 });

    expect(res.status).toBe(400);
  });

  it('ro\'yxatda o\'rtacha reyting va foydalanuvchi ko\'rsatiladi', async () => {
    const product = await setupProduct();
    const user1 = await createUser();
    const token1 = await loginAs(user1);
    const user2 = await createUser();
    const token2 = await loginAs(user2);

    await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ rating: 5, comment: 'Zo\'r' });
    await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ rating: 3, comment: 'Yaxshi' });

    const res = await request(app).get(`/api/products/${product._id}/reviews`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.averageRating).toBe(4);
    expect(res.body.data.ratingCount).toBe(2);
    expect(res.body.data.reviews[0].user.name).toBeTruthy();
  });

  it('egasi o\'z sharhini tahrirlay oladi va reyting qayta hisoblanadi', async () => {
    const product = await setupProduct();
    const user = await createUser();
    const token = await loginAs(user);
    const review = (await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5 })).body.data.review;

    const res = await request(app)
      .patch(`/api/products/${product._id}/reviews/${review._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.review.rating).toBe(2);

    const updated = await Product.findById(product._id);
    expect(updated!.averageRating).toBe(2);
  });

  it('boshqa foydalanuvchi sharhni o\'chira olmaydi', async () => {
    const product = await setupProduct();
    const user1 = await createUser();
    const token1 = await loginAs(user1);
    const user2 = await createUser();
    const token2 = await loginAs(user2);
    const review = (await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ rating: 5 })).body.data.review;

    const res = await request(app)
      .delete(`/api/products/${product._id}/reviews/${review._id}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(res.status).toBe(403);
  });

  it('egisi o\'z sharhini o\'chirsa reyting nolga qaytadi', async () => {
    const product = await setupProduct();
    const user = await createUser();
    const token = await loginAs(user);
    const review = (await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4 })).body.data.review;

    const res = await request(app)
      .delete(`/api/products/${product._id}/reviews/${review._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const updated = await Product.findById(product._id);
    expect(updated!.averageRating).toBe(0);
    expect(updated!.ratingCount).toBe(0);
  });

  it('tokensiz sharh qoldirib bo\'lmaydi', async () => {
    const product = await setupProduct();

    const res = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .send({ rating: 5 });

    expect(res.status).toBe(401);
  });

  it('noto\'g\'ri reyting rad etiladi', async () => {
    const product = await setupProduct();
    const user = await createUser();
    const token = await loginAs(user);

    const res = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 7 });

    expect(res.status).toBe(400);
  });
});
