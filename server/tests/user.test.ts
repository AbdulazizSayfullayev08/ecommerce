import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app';
import User from '../src/models/User';
import { UserRole } from '../src/types';

const app = createApp();

const TEST_PASSWORD = 'TestParol123';

async function createVerifiedUser(overrides: Record<string, unknown> = {}) {
  const user = await User.create({
    name: 'Test User',
    email: `user${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: TEST_PASSWORD,
    isVerified: true,
    ...overrides,
  });
  return user;
}

async function loginAs(user: { email: string }) {
  const res = await request(app).post('/api/auth/login').send({
    email: user.email,
    password: TEST_PASSWORD,
  });
  return res.body.data.accessToken as string;
}

const validAddress = {
  label: 'Uy',
  fullName: 'Ali Valiyev',
  phone: '+998901234567',
  region: 'Toshkent viloyati',
  city: 'Toshkent',
  street: 'Amir Temur ko\'chasi 12',
  zip: '100000',
};

describe('User API — profil', () => {
  it('profile yangilanadi (name)', async () => {
    const user = await createVerifiedUser();
    const token = await loginAs(user);

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Yangi Ism', phone: '+998901234567' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Yangi Ism');
    expect(res.body.data.user.phone).toBe('+998901234567');
  });

  it('profile — tokensiz 401', async () => {
    const res = await request(app).patch('/api/users/me').send({ name: 'X' });
    expect(res.status).toBe(401);
  });

  it('avatar yuklanadi', async () => {
    const user = await createVerifiedUser();
    const token = await loginAs(user);

    const res = await request(app)
      .post('/api/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.from('fake-image-bytes'), {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.avatar).toMatch(/\/uploads\/avatars\//);
  });

  it('avatar — noto\'g\'ri fayl turi rad etiladi', async () => {
    const user = await createVerifiedUser();
    const token = await loginAs(user);

    const res = await request(app)
      .post('/api/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.from('malware'), {
        filename: 'evil.exe',
        contentType: 'application/octet-stream',
      });

    expect(res.status).toBe(400);
  });
});

describe('User API — manzillar', () => {
  it('birinchi manzil qo\'shiladi va isDefault bo\'ladi', async () => {
    const user = await createVerifiedUser();
    const token = await loginAs(user);

    const res = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(validAddress);

    expect(res.status).toBe(201);
    expect(res.body.data.addresses).toHaveLength(1);
    expect(res.body.data.addresses[0].isDefault).toBe(true);
  });

  it('ikki manzil qo\'shilganda faqat bittasi default bo\'ladi', async () => {
    const user = await createVerifiedUser();
    const token = await loginAs(user);

    await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(validAddress);

    const second = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validAddress, label: 'Ish', isDefault: true });

    const addresses = second.body.data.addresses as { label: string; isDefault: boolean }[];
    expect(addresses.filter((a) => a.isDefault)).toHaveLength(1);
    expect(addresses.find((a) => a.label === 'Ish')?.isDefault).toBe(true);
  });

  it('manzil tahrirlanadi va o\'chiriladi', async () => {
    const user = await createVerifiedUser();
    const token = await loginAs(user);

    const created = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(validAddress);

    const addressId = created.body.data.addresses[0]._id;

    const updated = await request(app)
      .put(`/api/users/me/addresses/${addressId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validAddress, street: 'Yangi ko\'cha 5' });

    expect(updated.body.data.addresses[0].street).toBe('Yangi ko\'cha 5');

    const removed = await request(app)
      .delete(`/api/users/me/addresses/${addressId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(removed.status).toBe(200);
    expect(removed.body.data.addresses).toHaveLength(0);
  });

  it('manzil validatsiyasi — majburiy maydonlar', async () => {
    const user = await createVerifiedUser();
    const token = await loginAs(user);

    const res = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Ali' });

    expect(res.status).toBe(400);
  });
});

describe('User API — seller arizasi', () => {
  it('customer seller bo\'lishga ariza beradi', async () => {
    const user = await createVerifiedUser({ role: UserRole.CUSTOMER });
    const token = await loginAs(user);

    const res = await request(app)
      .post('/api/users/me/seller-application')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('seller');
    expect(res.body.data.user.isApproved).toBe(false);
  });

  it('tasdiqlangan seller qayta ariza bera olmaydi', async () => {
    const user = await createVerifiedUser({ role: UserRole.SELLER, isApproved: true });
    const token = await loginAs(user);

    const res = await request(app)
      .post('/api/users/me/seller-application')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('User API — admin boshqaruvi', () => {
  let adminToken: string;

  beforeEach(async () => {
    const admin = await createVerifiedUser({ role: UserRole.ADMIN });
    adminToken = await loginAs(admin);
  });

  it('foydalanuvchilar ro\'yxati', async () => {
    await createVerifiedUser();
    await createVerifiedUser({ role: UserRole.SELLER });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.users.length).toBeGreaterThanOrEqual(3);
    expect(res.body.data.total).toBeGreaterThanOrEqual(3);
  });

  it('search va role filtri', async () => {
    const target = await createVerifiedUser({ role: UserRole.SELLER, name: 'ZoRgaXona' });
    await createVerifiedUser();

    const res = await request(app)
      .get('/api/users')
      .query({ search: 'zorgaxona', role: 'seller' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.users).toHaveLength(1);
    expect(res.body.data.users[0].email).toBe(target.email);
  });

  it('rol o\'zgartiriladi', async () => {
    const target = await createVerifiedUser({ role: UserRole.CUSTOMER });

    const res = await request(app)
      .patch(`/api/users/${target._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'seller' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('seller');
    expect(res.body.data.user.isApproved).toBe(false);
  });

  it('seller tasdiqlanadi', async () => {
    const target = await createVerifiedUser({ role: UserRole.SELLER });

    const res = await request(app)
      .patch(`/api/users/${target._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isApproved: true });

    expect(res.status).toBe(200);
    expect(res.body.data.user.isApproved).toBe(true);
  });

  it('foydalanuvchi bloklanadi', async () => {
    const target = await createVerifiedUser();

    const res = await request(app)
      .patch(`/api/users/${target._id}/block`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isBlocked: true });

    expect(res.status).toBe(200);
    expect(res.body.data.user.isBlocked).toBe(true);
  });

  it('admin bo\'lmagan user admin endpointlarga kira olmaydi', async () => {
    const customer = await createVerifiedUser({ role: UserRole.CUSTOMER });
    const token = await loginAs(customer);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
