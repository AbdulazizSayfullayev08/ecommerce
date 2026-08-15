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

## Faza holati

- [x] Faza 1 — Skeleton: Express+TS, Vite+React+TS, MongoDB ulash
- [x] Faza 2 — Auth: register, OTP email tasdiqlash, login, JWT refresh rotation, logout, parolni tiklash, rate limiting, 17 avtomatik test
- [ ] Faza 3 — User profili + manzillar + rollar
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
