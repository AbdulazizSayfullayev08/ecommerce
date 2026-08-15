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
- Testlar: `cd server && npm test` (69 test)

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

## API endpointlar (Faza 4)

### Auth (Faza 2)
- `POST /api/auth/register` — ro'yxatdan o'tish (OTP emailga yuboriladi)
- `POST /api/auth/verify-email` — OTP bilan tasdiqlash
- `POST /api/auth/login` — login (access token + refresh cookie)
- `POST /api/auth/refresh` — access tokenni yangilash (rotation)
- `POST /api/auth/logout` — chiqish
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` — parolni tiklash

### Foydalanuvchi (Faza 3)
- `PATCH /api/users/me` — profilni yangilash (name, phone)
- `POST /api/users/me/avatar` — avatar yuklash (multipart)
- `GET|POST /api/users/me/addresses` — manzillar
- `PUT|DELETE /api/users/me/addresses/:id` — manzil tahrirlash/o'chirish
- `PATCH /api/users/me/addresses/:id/default` — standart manzil
- `POST /api/users/me/seller-application` — seller bo'lish arizasi
- `GET /api/users` — admin: foydalanuvchilar (search/role/page)
- `PATCH /api/users/:id/role|block|approve` — admin boshqaruvi

### Kategoriya
- `GET /api/categories` — faol kategoriyalar (admin: `?all=true`)
- `GET /api/categories/:slug` — bitta kategoriya
- `POST /api/categories` — admin: yaratish (slug avtomatik)
- `PUT /api/categories/:id` — admin: yangilash
- `DELETE /api/categories/:id` — admin: o'chirish (ichida mahsulot bo'lmasa)

### Mahsulot
- `GET /api/products` — ro'yxat, filter: `q`, `category` (slug), `minPrice`, `maxPrice`, `seller`, `inStock`, `isFeatured`, `sort` (newest|price_asc|price_desc|rating|oldest), `page`, `limit`
- `GET /api/products/featured` — tavsiya etilgan
- `GET /api/products/:slug` — bitta mahsulot
- `GET /api/products/mine` — seller: o'z mahsulotlari
- `POST /api/products` — tasdiqlangan seller/admin: yaratish
- `PUT /api/products/:id` — egasi/admin: yangilash
- `PATCH /api/products/:id/active` — egasi/admin: faollikni almashtirish
- `POST /api/products/:id/images` — egasi/admin: rasm yuklash (`images` array, max 5)
- `DELETE /api/products/:id` — egasi/admin: o'chirish

## API endpointlar (Faza 6)

### Cart (kirish talab qilinadi)
- `GET /api/cart` — savat (itemCount, subtotal/discount/total bilan)
- `DELETE /api/cart` — savatni tozalash
- `POST /api/cart/items` — qo'shish (`productId`, `qty`) — stock chekloviga bo'ysunadi
- `PATCH /api/cart/items/:productId` — miqdorni yangilash (`qty`, 0 bo'lsa o'chiriladi)
- `DELETE /api/cart/items/:productId` — itemni o'chirish
- `POST /api/cart/coupon` — kupon qo'llash (`code`)
- `DELETE /api/cart/coupon` — kupondan voz kechish

### Kupon (admin)
- `GET /api/coupons` — ro'yxat (search/type/active/page)
- `POST /api/coupons` — yaratish (percentage|fixed, minAmount, maxDiscount, expiresAt, usageLimit)
- `PUT /api/coupons/:id` — yangilash
- `DELETE /api/coupons/:id` — o'chirish

## API endpointlar (Faza 7)

### Checkout (kirish talab qilinadi)
- `POST /api/checkout` — Stripe Checkout Session yaratish (`addressId`) → `{ url, orderNumber }`; to'lov tasdiqlanganda webhook buyurtmani `paid` qiladi
- `POST /api/checkout/cod` — yetkazib berishda to'lash; buyurtma darhol `processing`, stock kamayadi, savat tozalanadi, kupon iste'moli oshadi
- `POST /api/checkout/webhook` — Stripe webhook (`checkout.session.completed` → `paid`, stock, savat). Dev rejimda (`STRIPE_WEBHOOK_SECRET` bo'sh) oddiy JSON event qabul qilinadi; production'da signature tekshiriladi

## Faza holati

- [x] Faza 1 — Skeleton: Express+TS, Vite+React+TS, MongoDB ulash
- [x] Faza 2 — Auth: register, OTP email tasdiqlash, login, JWT refresh rotation, logout, parolni tiklash, rate limiting, 17 avtomatik test
- [x] Faza 3 — Profil + avatar upload, manzillar CRUD, seller arizasi, admin foydalanuvchi boshqaruvi (rol/blok/tasdiqlash), 16 avtomatik test
- [x] Faza 4 — Product/Category modellari + API (slug avtomatik, upload, filter/sort/pagination), 15 avtomatik test
- [x] Faza 5 — Frontend: uy sahifa, mahsulotlar ro'yxati, filter, sort, pagination, mahsulot sahifasi
- [x] Faza 6 — Cart + kupon (server + client: savat sahifasi, miqdor, kupon maydoni, nav badge), 12 avtomatik test
- [x] Faza 7 — Checkout + Stripe (COD buyurtma, Stripe Session + webhook, stock kamayishi, client checkout sahifasi), 9 avtomatik test
- [ ] Faza 8 — Order tizimi + email
- [ ] Faza 8 — Order tizimi + email
- [ ] Faza 9 — Store/Seller moduli
- [ ] Faza 10 — Payout/komissiya
- [ ] Faza 11 — Admin panel
- [ ] Faza 12 — Socket.io live
- [ ] Faza 13 — Premium feature'lar
- [ ] Faza 14 — Xavfsizlik + optimizatsiya
- [ ] Faza 15 — README + seed + deploy
