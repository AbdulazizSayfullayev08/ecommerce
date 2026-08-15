import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app';
import User from '../src/models/User';
import Category from '../src/models/Category';
import Product from '../src/models/Product';
import { UserRole } from '../src/types';

const app = createApp();
const TEST_PASSWORD = 'TestParol123';

async function createUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    name: 'Test User',
    email: `cat${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
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

async function createAdmin() {
  const user = await createUser({ role: UserRole.ADMIN });
  return { user, token: await loginAs(user) };
}

async function createSeller(approved = true) {
  const user = await createUser({ role: UserRole.SELLER, isApproved: approved });
  return { user, token: await loginAs(user) };
}

const categoryInput = {
  name: 'Elektronika',
  description: 'Elektron qurilmalar',
};

describe('Category API', () => {
  it('admin kategoriya yaratadi — slug avtomatik generatsiya qilinadi', async () => {
    const { token } = await createAdmin();

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(categoryInput);

    expect(res.status).toBe(201);
    expect(res.body.data.category.name).toBe('Elektronika');
    expect(res.body.data.category.slug).toBe('elektronika');
    expect(res.body.data.category.isActive).toBe(true);
  });

  it('admin bo\'lmagan kategoriya yarata olmaydi', async () => {
    const { token } = await createSeller();

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(categoryInput);

    expect(res.status).toBe(403);
  });

  it('bir xil nom takrorlanmaydi', async () => {
    const { token } = await createAdmin();
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(categoryInput);

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...categoryInput, name: '  Elektronika  ' });

    expect(res.status).toBe(409);
  });

  it('public kategoriyalar ro\'yxati — faqat faollari', async () => {
    const { token } = await createAdmin();
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Kiyim' });
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Yashirin', isActive: false });

    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    const names = res.body.data.categories.map((c: { name: string }) => c.name);
    expect(names).toContain('Kiyim');
    expect(names).not.toContain('Yashirin');
  });

  it('parent bilan ierarxiya quriladi', async () => {
    const { token } = await createAdmin();
    const parent = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Texnika' });

    const parentId = parent.body.data.category._id;
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Telefonlar', parent: parentId });

    const res = await request(app).get('/api/categories');
    const root = res.body.data.categories.find(
      (c: { name: string }) => c.name === 'Texnika'
    );
    expect(root.children).toHaveLength(1);
    expect(root.children[0].name).toBe('Telefonlar');
  });
});

describe('Product API', () => {
  async function setupCategory() {
    const { token } = await createAdmin();
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(categoryInput);
    return res.body.data.category;
  }

  function productInput(categoryId: string, overrides: Record<string, unknown> = {}) {
    return {
      category: categoryId,
      name: 'Smartfon X200',
      description: 'Zamonaviy smartfon',
      brand: 'Texno',
      price: 2500000,
      compareAtPrice: 3000000,
      stock: 10,
      ...overrides,
    };
  }

  it('tasdiqlangan seller mahsulot yaratadi', async () => {
    const category = await setupCategory();
    const { token } = await createSeller();

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productInput(category._id));

    expect(res.status).toBe(201);
    expect(res.body.data.product.name).toBe('Smartfon X200');
    expect(res.body.data.product.slug).toBe('smartfon-x200');
    expect(res.body.data.product.price).toBe(2500000);
  });

  it('tasdiqlanmagan seller mahsulot yarata olmaydi', async () => {
    const category = await setupCategory();
    const { token } = await createSeller(false);

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productInput(category._id));

    expect(res.status).toBe(403);
  });

  it('public ro\'yxat — faqat faol mahsulotlar', async () => {
    const category = await setupCategory();
    const { token } = await createSeller();
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productInput(category._id, { name: 'Faol Mahsulot' }));
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productInput(category._id, { name: 'Yashirin Mahsulot', isActive: false }));

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    const names = res.body.data.products.map((p: { name: string }) => p.name);
    expect(names).toContain('Faol Mahsulot');
    expect(names).not.toContain('Yashirin Mahsulot');
  });

  it('filter: kategoriya va narx', async () => {
    const category = await setupCategory();
    const { token } = await createSeller();
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productInput(category._id, { name: 'Arzon', price: 1000 }));
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productInput(category._id, { name: 'Qimmat', price: 9000000 }));

    const byCategory = await request(app)
      .get('/api/products')
      .query({ category: category.slug });
    expect(byCategory.body.data.total).toBe(2);

    const byPrice = await request(app)
      .get('/api/products')
      .query({ minPrice: 5000 });
    expect(byPrice.body.data.total).toBe(1);
    expect(byPrice.body.data.products[0].name).toBe('Qimmat');
  });

  it('mahsulot slug orqali olinadi', async () => {
    const category = await setupCategory();
    const { token } = await createSeller();
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productInput(category._id));

    const slug = created.body.data.product.slug;
    const res = await request(app).get(`/api/products/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe('Smartfon X200');
    expect(res.body.data.product.category.slug).toBe('elektronika');
  });

  it('egasi mahsulotni yangilay oladi, boshqa seller yo\'q', async () => {
    const category = await setupCategory();
    const owner = await createSeller();
    const other = await createSeller();

    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${owner.token}`)
      .send(productInput(category._id));

    const productId = created.body.data.product._id;

    const forbidden = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ price: 1 });
    expect(forbidden.status).toBe(403);

    const updated = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ price: 2900000, stock: 5 });
    expect(updated.status).toBe(200);
    expect(updated.body.data.product.price).toBe(2900000);
    expect(updated.body.data.product.stock).toBe(5);
  });

  it('featured mahsulotlar', async () => {
    const category = await setupCategory();
    const seller = await createSeller();
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${seller.token}`)
      .send(productInput(category._id, { name: 'Tavsiya etilgan' }));
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${seller.token}`)
      .send(productInput(category._id, { name: 'Oddiy' }));

    const product = await Product.findOne({ name: 'Tavsiya etilgan' });
    product!.isFeatured = true;
    await product!.save();

    const res = await request(app).get('/api/products/featured');
    expect(res.status).toBe(200);
    const names = res.body.data.products.map((p: { name: string }) => p.name);
    expect(names).toContain('Tavsiya etilgan');
    expect(names).not.toContain('Oddiy');
  });

  it('admin mahsulotni o\'chira oladi', async () => {
    const category = await setupCategory();
    const seller = await createSeller();
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${seller.token}`)
      .send(productInput(category._id));

    const { token: adminToken } = await createAdmin();
    const res = await request(app)
      .delete(`/api/products/${created.body.data.product._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('kategoriyasi bo\'lgan mahsulotda kategoriya o\'chirilmaydi', async () => {
    const category = await setupCategory();
    const seller = await createSeller();
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${seller.token}`)
      .send(productInput(category._id));

    const { token: adminToken } = await createAdmin();
    const res = await request(app)
      .delete(`/api/categories/${category._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  it('mahsulot rasmlari yuklanadi', async () => {
    const category = await setupCategory();
    const seller = await createSeller();
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${seller.token}`)
      .send(productInput(category._id));

    const productId = created.body.data.product._id;
    const res = await request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${seller.token}`)
      .attach('images', Buffer.from('img1'), { filename: '1.png', contentType: 'image/png' })
      .attach('images', Buffer.from('img2'), { filename: '2.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.data.product.images).toHaveLength(2);
    expect(res.body.data.product.images[0]).toMatch(/\/uploads\/products\//);
  });
});
