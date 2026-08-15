import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';
import { createApp } from '../src/app';
import User from '../src/models/User';
import Order from '../src/models/Order';
import { UserRole } from '../src/types';

vi.mock('../src/lib/stripe', () => ({
  stripe: null,
}));

vi.mock('../src/utils/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

const app = createApp();
const TEST_PASSWORD = 'TestParol123';

async function createUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    name: 'Order User',
    email: `order${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
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
    });
  const list = res.body.data.addresses;
  return list[list.length - 1]._id as string;
}

async function setupProduct() {
  const admin = await createUser({ role: UserRole.ADMIN });
  const adminToken = await loginAs(admin);
  const catRes = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `OrderKot ${Date.now()}` });
  const categoryId = catRes.body.data.category._id;

  const seller = await createUser({ role: UserRole.SELLER, isApproved: true });
  const sellerToken = await loginAs(seller);
  const prodRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ category: categoryId, name: `Order Mahsulot ${Date.now()}`, price: 100000, stock: 10 });
  return { seller, sellerToken, product: prodRes.body.data.product };
}

async function createCodOrder(token: string, addressId: string, productId: string) {
  await request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId, qty: 2 });
  const res = await request(app)
    .post('/api/checkout/cod')
    .set('Authorization', `Bearer ${token}`)
    .send({ addressId });
  return res.body.data.order;
}

describe('Orders API', () => {
  it('buyurtmalarim ro\'yxati va bitta buyurtma', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const addressId = await addAddress(token);
    const { product } = await setupProduct();

    const order = await createCodOrder(token, addressId, product._id);

    const list = await request(app)
      .get('/api/orders/mine')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.orders.length).toBeGreaterThan(0);
    expect(list.body.data.total).toBeGreaterThan(0);
    expect(list.body.data.orders[0].orderNumber).toBe(order.orderNumber);

    const one = await request(app)
      .get(`/api/orders/mine/${order._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(one.status).toBe(200);
    expect(one.body.data.order.orderNumber).toBe(order.orderNumber);
  });

  it('status bo\'yicha filter', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const addressId = await addAddress(token);
    const { product } = await setupProduct();
    await createCodOrder(token, addressId, product._id);

    const res = await request(app)
      .get('/api/orders/mine?status=processing')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data.orders.every((o: { status: string }) => o.status === 'processing')).toBe(true);
  });

  it('boshqa foydalanuvchi buyurtmasini ko\'ra olmaydi', async () => {
    const userA = await createUser();
    const tokenA = await loginAs(userA);
    const addressIdA = await addAddress(tokenA);
    const { product } = await setupProduct();
    const order = await createCodOrder(tokenA, addressIdA, product._id);

    const userB = await createUser();
    const tokenB = await loginAs(userB);
    const res = await request(app)
      .get(`/api/orders/mine/${order._id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('admin barcha buyurtmalarni ko\'radi va holatni o\'zgartiradi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const addressId = await addAddress(token);
    const { product } = await setupProduct();
    const order = await createCodOrder(token, addressId, product._id);

    const admin = await createUser({ role: UserRole.ADMIN });
    const adminToken = await loginAs(admin);

    const list = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.orders.some((o: { _id: string }) => o._id === String(order._id))).toBe(true);

    const update = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' });
    expect(update.status).toBe(200);
    expect(update.body.data.order.status).toBe('delivered');

    const check = await request(app)
      .get(`/api/orders/mine/${order._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(check.body.data.order.status).toBe('delivered');
  });

  it('admin bo\'lmagan holat o\'zgartira olmaydi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const addressId = await addAddress(token);
    const { product } = await setupProduct();
    const order = await createCodOrder(token, addressId, product._id);

    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(403);
  });

  it('noto\'g\'ri holat qabul qilinmaydi', async () => {
    const admin = await createUser({ role: UserRole.ADMIN });
    const adminToken = await loginAs(admin);

    const res = await request(app)
      .patch(`/api/orders/000000000000000000000000/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped2' });
    expect(res.status).toBe(400);
  });

  it('seller o\'z do\'konidagi buyurtmalarni ko\'radi', async () => {
    const user = await createUser();
    const token = await loginAs(user);
    const addressId = await addAddress(token);
    const { sellerToken, product } = await setupProduct();
    const order = await createCodOrder(token, addressId, product._id);

    const res = await request(app)
      .get('/api/orders/seller')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.orders.some((o: { _id: string }) => o._id === String(order._id))).toBe(true);
  });

  it('tokensiz buyurtmalar olinmaydi', async () => {
    const res = await request(app).get('/api/orders/mine');
    expect(res.status).toBe(401);
  });

  it('karta (stripe) buyurtmasi ham ro\'yxatda qatnashadi', async () => {
    const admin = await createUser({ role: UserRole.ADMIN });
    const adminToken = await loginAs(admin);
    const user = await createUser();
    const token = await loginAs(user);
    const seller = await createUser({ role: UserRole.SELLER, isApproved: true });

    await Order.create({
      user: user._id,
      orderNumber: `ORD-STRIPE-TEST-${Date.now()}`,
      items: [
        {
          product: '000000000000000000000001',
          seller: seller._id,
          name: 'Test',
          price: 100,
          qty: 1,
        },
      ],
      address: { fullName: 'Aziz', phone: '+998', region: 'T', city: 'T', street: 'S' },
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      status: 'processing',
      subtotal: 100,
      discount: 0,
      total: 100,
      stripeSessionId: 'cs_test_' + Date.now(),
    });

    const list = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`);
    const paid = list.body.data.orders.find((o: { paymentStatus: string }) => o.paymentStatus === 'paid');
    expect(paid).toBeTruthy();
  });
});
