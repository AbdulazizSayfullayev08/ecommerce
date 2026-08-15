import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app';
import User from '../src/models/User';
import Store from '../src/models/Store';
import { UserRole } from '../src/types';

const app = createApp();
const TEST_PASSWORD = 'TestParol123';

async function createUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    name: 'Store User',
    email: `store${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
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

describe('Store API', () => {
  it('tasdiqlanmagan seller do\'kon yarata olmaydi', async () => {
    const seller = await createUser({ role: UserRole.SELLER, isApproved: false });
    const token = await loginAs(seller);

    const res = await request(app)
      .post('/api/stores')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Mening do\'konim' });
    expect(res.status).toBe(403);
  });

  it('tasdiqlangan seller do\'kon yaratadi va o\'z do\'konini ko\'radi', async () => {
    const seller = await createUser({ role: UserRole.SELLER, isApproved: true });
    const token = await loginAs(seller);

    const create = await request(app)
      .post('/api/stores')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Zamonaviy Do\'kon', description: 'Eng sifatli mahsulotlar' });

    expect(create.status).toBe(201);
    const store = create.body.data.store;
    expect(store.name).toBe('Zamonaviy Do\'kon');
    expect(store.slug).toBe('zamonaviy-dokon');

    const mine = await request(app)
      .get('/api/stores/mine')
      .set('Authorization', `Bearer ${token}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data.store._id).toBe(String(store._id));

    const updated = await request(app)
      .put('/api/stores')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Yangilangan tavsif' });
    expect(updated.body.data.store.description).toBe('Yangilangan tavsif');
  });

  it('bitta seller faqat bitta do\'kon yarata oladi', async () => {
    const seller = await createUser({ role: UserRole.SELLER, isApproved: true });
    const token = await loginAs(seller);
    await request(app)
      .post('/api/stores')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Birinchi do\'kon' });

    const res = await request(app)
      .post('/api/stores')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ikkinchi do\'kon' });
    expect(res.status).toBe(409);
  });

  it('customer do\'kon yarata olmaydi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const res = await request(app)
      .post('/api/stores')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Do\'koncha' });
    expect(res.status).toBe(403);
  });

  it('do\'kon sahifasi slug orqali ochiladi va mahsulotlari ko\'rinadi', async () => {
    const seller = await createUser({ role: UserRole.SELLER, isApproved: true });
    const sellerToken = await loginAs(seller);
    const create = await request(app)
      .post('/api/stores')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ name: 'Tajriba Do\'koni' });
    const slug = create.body.data.store.slug;

    const admin = await createUser({ role: UserRole.ADMIN });
    const adminToken = await loginAs(admin);
    const catRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `StoreKot ${Date.now()}` });
    const categoryId = catRes.body.data.category._id;

    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ category: categoryId, name: 'Store mahsulot', price: 50000, stock: 5 });

    const res = await request(app).get(`/api/stores/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.store.slug).toBe(slug);
    expect(res.body.data.products.length).toBe(1);
    expect(res.body.data.productCount).toBe(1);
  });

  it('admin tasdiqlaganda seller uchun avtomatik do\'kon yaratiladi', async () => {
    const seller = await createUser({ role: UserRole.SELLER, isApproved: false });
    const admin = await createUser({ role: UserRole.ADMIN });
    const adminToken = await loginAs(admin);

    await request(app)
      .patch(`/api/users/${seller._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isApproved: true });

    const store = await Store.findOne({ owner: seller._id });
    expect(store).not.toBeNull();
    expect(store!.name).toContain('Store User');
  });

  it('mavjud bo\'lmagan do\'kon 404 qaytaradi', async () => {
    const res = await request(app).get('/api/stores/yoq-bunday');
    expect(res.status).toBe(404);
  });
});
