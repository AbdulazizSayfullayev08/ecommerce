import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app';
import User from '../src/models/User';
import Category from '../src/models/Category';
import Product from '../src/models/Product';
import Coupon from '../src/models/Coupon';
import { UserRole } from '../src/types';

const app = createApp();
const TEST_PASSWORD = 'TestParol123';

async function createUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    name: 'Cart User',
    email: `cart${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
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

async function setupProduct(price = 100000) {
  const admin = await createUser({ role: UserRole.ADMIN });
  const adminToken = await loginAs(admin);
  const catRes = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `CartKot ${Date.now()}` });
  const categoryId = catRes.body.data.category._id;

  const seller = await createUser({ role: UserRole.SELLER, isApproved: true });
  const sellerToken = await loginAs(seller);
  const prodRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      category: categoryId,
      name: `Cart Mahsulot ${Date.now()}`,
      price,
      stock: 10,
    });
  return prodRes.body.data.product;
}

describe('Cart API', () => {
  it('bo\'sh savat olinadi', async () => {
    const user = await createUser();
    const token = await loginAs(user);

    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toEqual([]);
    expect(res.body.data.cart.itemCount).toBe(0);
    expect(res.body.data.cart.totals.total).toBe(0);
  });

  it('mahsulot savatga qo\'shiladi va qayta qo\'shilsa miqdori oshadi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const product = await setupProduct();

    const add1 = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 2 });
    expect(add1.status).toBe(200);
    expect(add1.body.data.cart.itemCount).toBe(2);
    expect(add1.body.data.cart.totals.subtotal).toBe(200000);

    const add2 = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 1 });
    expect(add2.body.data.cart.items[0].qty).toBe(3);
    expect(add2.body.data.cart.itemCount).toBe(3);
  });

  it('mahsulot tugagan bo\'lsa qo\'shib bo\'lmaydi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const product = await setupProduct();
    await Product.findByIdAndUpdate(product._id, { stock: 1 });

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 5 });

    expect(res.status).toBe(400);
  });

  it('miqdor yangilanadi va 0 bo\'lsa o\'chiriladi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const product = await setupProduct();
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 2 });

    const upd = await request(app)
      .patch(`/api/cart/items/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qty: 4 });
    expect(upd.status).toBe(200);
    expect(upd.body.data.cart.items[0].qty).toBe(4);

    const removed = await request(app)
      .patch(`/api/cart/items/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ qty: 0 });
    expect(removed.body.data.cart.items).toEqual([]);
  });

  it('savat tozalanadi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const product = await setupProduct();
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 1 });

    const res = await request(app)
      .delete('/api/cart')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toEqual([]);
  });

  it('tokensiz savatga kirish mumkin emas', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });
});

describe('Coupon API', () => {
  it('admin kupon yaratadi va mijoz qo\'llaydi', async () => {
    const admin = await createUser({ role: UserRole.ADMIN });
    const adminToken = await loginAs(admin);

    const couponRes = await request(app)
      .post('/api/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'SALE10', type: 'percentage', value: 10 });

    expect(couponRes.status).toBe(201);
    expect(couponRes.body.data.coupon.code).toBe('SALE10');

    const user = await createUser();
    const token = await loginAs(user);
    const product = await setupProduct(100000);
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 2 });

    const apply = await request(app)
      .post('/api/cart/coupon')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'sale10' });

    expect(apply.status).toBe(200);
    expect(apply.body.data.cart.couponCode).toBe('SALE10');
    expect(apply.body.data.cart.totals.subtotal).toBe(200000);
    expect(apply.body.data.cart.totals.discount).toBe(20000);
    expect(apply.body.data.cart.totals.total).toBe(180000);
  });

  it('yaroqsiz kupon rad etiladi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const product = await setupProduct(100000);
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 1 });

    const res = await request(app)
      .post('/api/cart/coupon')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'NOEXIST' });

    expect(res.status).toBe(404);
  });

  it('minAmount talabi bajarilmasa rad etiladi', async () => {
    const admin = await createUser({ role: UserRole.ADMIN });
    const adminToken = await loginAs(admin);
    await request(app)
      .post('/api/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'MIN500', type: 'fixed', value: 50000, minAmount: 500000 });

    const user = await createUser();
    const token = await loginAs(user);
    const product = await setupProduct(100000);
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 1 });

    const res = await request(app)
      .post('/api/cart/coupon')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'MIN500' });

    expect(res.status).toBe(400);
  });

  it('muddati o\'tgan kupon rad etiladi', async () => {
    const admin = await createUser({ role: UserRole.ADMIN });
    const adminToken = await loginAs(admin);
    await request(app)
      .post('/api/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'OLD1',
        type: 'percentage',
        value: 10,
        expiresAt: '2020-01-01T00:00:00Z',
      });

    const user = await createUser();
    const token = await loginAs(user);
    const product = await setupProduct(100000);
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 1 });

    const res = await request(app)
      .post('/api/cart/coupon')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'OLD1' });

    expect(res.status).toBe(400);
  });

  it('admin bo\'lmagan kupon yarata olmaydi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const res = await request(app)
      .post('/api/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'NOPE', type: 'percentage', value: 10 });
    expect(res.status).toBe(403);
  });

  it('kupon olib tashlanadi', async () => {
    const admin = await createUser({ role: UserRole.ADMIN });
    const adminToken = await loginAs(admin);
    await request(app)
      .post('/api/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'RM1', type: 'percentage', value: 5 });

    const user = await createUser();
    const token = await loginAs(user);
    const product = await setupProduct(100000);
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 1 });
    await request(app)
      .post('/api/cart/coupon')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'RM1' });

    const res = await request(app)
      .delete('/api/cart/coupon')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.cart.couponCode).toBeNull();
    expect(res.body.data.cart.totals.discount).toBe(0);
  });
});
