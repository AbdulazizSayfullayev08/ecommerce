# 🛒 Multi-vendor E-commerce (MERN + TypeScript)

To'liq funksional multi-vendor onlayn-do'kon platformasi.
Rollar: **Admin**, **Seller**, **Customer**, **Guest**.

## Texnologiyalar

| Qatlam | Texnologiya |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| UI | Tailwind CSS v4 |
| Backend | Node.js + Express + TypeScript |
| Ma'lumot | MongoDB + Mongoose |
| Auth | JWT (access + refresh rotation), bcrypt |
| To'lov | Stripe (test mode) + COD |
| Email | Nodemailer + Resend SMTP (bepul 100 email/kun) |
| Upload | Multer (lokal storage) |

## Struktura

```
├── server/   # Express + TypeScript API
└── client/   # Vite + React + TypeScript
```

## Ishga tushirish

Talab: Node 20+, MongoDB Atlas connection string

```bash
# Backend
cd server
npm install
cp .env.example .env   # MONGO_URI va SMTP ma'lumotlarini to'ldiring
npm run dev            # http://localhost:5000

# Frontend (boshqa terminal)
cd client
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```

## Tekshirish

- Health: `GET http://localhost:5000/api/health`
- Frontend orqali: `GET http://localhost:5173/api/health`
- Testlar: `cd server && npm test` (33 test)

## Seed ma'lumotlar

Demo foydalanuvchilarni yaratish uchun (admin/seller/customer):

```bash
cd server
npm run seed
```

| Rol | Email | Parol |
|---|---|---|
| Admin | admin@ecommerce.local | Admin12345 |
| Seller | seller@ecommerce.local | Seller12345 |
| Customer | customer@ecommerce.local | Customer12345 |

## API endpointlar (Faza 3)

- `PATCH /api/users/me` — profilni yangilash (name, phone)
- `POST /api/users/me/avatar` — avatar yuklash (multipart)
- `GET|POST /api/users/me/addresses` — manzillar
- `PUT|DELETE /api/users/me/addresses/:id` — manzil tahrirlash/o'chirish
- `PATCH /api/users/me/addresses/:id/default` — standart manzil
- `POST /api/users/me/seller-application` — seller bo'lish arizasi
- `GET /api/users` — admin: foydalanuvchilar (search/role/page)
- `PATCH /api/users/:id/role|block|approve` — admin boshqaruvi

## Faza holati

- [x] Faza 1 — Skeleton: Express+TS, Vite+React+TS, MongoDB ulash
- [x] Faza 2 — Auth: register, OTP email tasdiqlash, login, JWT refresh rotation, logout, parolni tiklash, rate limiting, 17 avtomatik test
- [x] Faza 3 — Profil + avatar upload, manzillar CRUD, seller arizasi, admin foydalanuvchi boshqaruvi (rol/blok/tasdiqlash), 16 avtomatik test
- [ ] Faza 4 — Product/Category modellari + API
- [ ] Faza 5 — Frontend: uy sahifa, mahsulotlar, filter
- [ ] Faza 6 — Cart + kupon
- [ ] Faza 7 — Checkout + Stripe
- [ ] Faza 8 — Order tizimi + email
- [ ] Faza 9 — Store/Seller moduli
- [ ] Faza 10 — Payout/komissiya
- [ ] Faza 11 — Admin panel
- [ ] Faza 12 — Socket.io live
- [ ] Faza 13 — Premium feature'lar
- [ ] Faza 14 — Xavfsizlik + optimizatsiya
- [ ] Faza 15 — README + seed + deploy
