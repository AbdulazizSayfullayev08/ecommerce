import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app';

const app = createApp();

interface AuthResponse {
  success: boolean;
  data: {
    user: { name: string; email: string; role: string; isVerified: boolean };
    accessToken?: string;
    message?: string;
  };
}

function validUser() {
  return {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'TestParol123',
  };
}

describe('Auth API', () => {
  it('health check ishlaydi', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('register — yangi foydalanuvchi yaratiladi, isVerified=false', async () => {
    const user = validUser();
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user.isVerified).toBe(false);
  });

  it('register — bir xil email qayta ishlatilmaydi', async () => {
    const user = validUser();
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(409);
  });

  it('register — validatsiya: qisqa parol rad etiladi', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Ali',
      email: 'ali@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('login — noto\'g\'ri parol 401 qaytaradi', async () => {
    const user = validUser();
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'XatoParol123',
    });
    expect(res.status).toBe(401);
  });

  it('login — verified bo\'lmagan user 403 qaytaradi', async () => {
    const user = validUser();
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password,
    });
    expect(res.status).toBe(403);
    expect(res.body.errors?.needsVerification).toBe(true);
  });

  it('verify-email — OTP bilan tasdiqlash ishlaydi', async () => {
    const user = validUser();
    await request(app).post('/api/auth/register').send(user);

    // OTP ni bazadan o'qiymiz (select:false — to'g'ridan olamiz)
    const { default: User } = await import('../src/models/User');
    const doc = await User.findOne({ email: user.email }).select('+otp');
    const otp = doc?.get('otp') as string;
    expect(otp).toHaveLength(6);

    const res = await request(app).post('/api/auth/verify-email').send({
      email: user.email,
      otp,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.user.isVerified).toBe(true);
  });

  it('verify-email — noto\'g\'ri OTP 400 qaytaradi', async () => {
    const user = validUser();
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).post('/api/auth/verify-email').send({
      email: user.email,
      otp: '000000',
    });
    expect(res.status).toBe(400);
  });

  it('login -> access token + refresh cookie', async () => {
    const user = validUser();
    await request(app).post('/api/auth/register').send(user);

    const { default: User } = await import('../src/models/User');
    const doc = await User.findOne({ email: user.email }).select('+otp');
    const otp = doc?.get('otp') as string;
    await request(app).post('/api/auth/verify-email').send({ email: user.email, otp });

    const res = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
  });

  it('refresh — yangi access token beradi (rotation)', async () => {
    const user = validUser();
    await request(app).post('/api/auth/register').send(user);
    const { default: User } = await import('../src/models/User');
    const doc = await User.findOne({ email: user.email }).select('+otp');
    const otp = doc?.get('otp') as string;
    await request(app).post('/api/auth/verify-email').send({ email: user.email, otp });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password,
    });
    const cookie = (loginRes.headers['set-cookie'] as unknown as string[])[0];

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeTruthy();
  });

  it('refresh — cookiesiz 401 qaytaradi', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('protected route — tokensiz 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('protected route — token bilan ishlaydi', async () => {
    const user = validUser();
    await request(app).post('/api/auth/register').send(user);
    const { default: User } = await import('../src/models/User');
    const doc = await User.findOne({ email: user.email }).select('+otp');
    const otp = doc?.get('otp') as string;
    await request(app).post('/api/auth/verify-email').send({ email: user.email, otp });
    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password,
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(user.email);
  });

  it('logout — refresh tokenni bekor qiladi', async () => {
    const user = validUser();
    await request(app).post('/api/auth/register').send(user);
    const { default: User } = await import('../src/models/User');
    const doc = await User.findOne({ email: user.email }).select('+otp');
    const otp = doc?.get('otp') as string;
    await request(app).post('/api/auth/verify-email').send({ email: user.email, otp });
    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password,
    });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`);
    expect(res.status).toBe(200);
  });

  it('forgot-password — mavjud emailga 200 qaytaradi', async () => {
    const user = validUser();
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: user.email });
    expect(res.status).toBe(200);
  });

  it('reset-password — token bilan parol yangilanadi', async () => {
    const user = validUser();
    await request(app).post('/api/auth/register').send(user);
    await request(app).post('/api/auth/forgot-password').send({ email: user.email });

    const { default: User } = await import('../src/models/User');
    const doc = await User.findOne({ email: user.email }).select('+resetToken');
    const token = doc?.get('resetToken') as string;
    expect(token).toBeTruthy();

    const res = await request(app).post('/api/auth/reset-password').send({
      token,
      password: 'YangiParol456',
    });
    expect(res.status).toBe(200);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'YangiParol456',
    });
    expect(loginRes.status).toBe(200);
  });

  it('register — 6 xonali OTP formati', async () => {
    const user = validUser();
    await request(app).post('/api/auth/register').send(user);
    const { default: User } = await import('../src/models/User');
    const doc = await User.findOne({ email: user.email }).select('+otp');
    const otp = doc?.get('otp') as string;
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });
});
