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
- Testlar: `cd server && npm test` (105 test)

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

## API endpointlar (Faza 8)

### Order (kirish talab qilinadi)
- `GET /api/orders/mine` — mijoz o'z buyurtmalari (`status`, `page`, `limit` filter)
- `GET /api/orders/mine/:id` — bitta buyurtma (faqat egasi)
- `GET /api/orders` — admin: barcha buyurtmalar (`status`, `paymentStatus`, `q`, `page`, `limit`)
- `PATCH /api/orders/:id/status` — admin: holat (pending|processing|shipped|delivered|cancelled) + email
- `GET /api/orders/seller` — seller: o'z mahsulotlari kiritilgan buyurtmalar
- Buyurtma tasdiqlash va holat o'zgarishi email orqali xabar qilinadi

## API endpointlar (Faza 9)

### Store/Seller
- `GET /api/stores` — do'konlar ro'yxati (`q`, `page`, `limit`)
- `GET /api/stores/:slug` — do'kon sahifasi (do'kon + uning mahsulotlari)
- `GET /api/stores/mine` — seller: o'z do'koni
- `POST /api/stores` — tasdiqlangan seller: do'kon yaratish (bitta seller — bitta do'kon)
- `PUT /api/stores` — egasi: yangilash (nom avtomatik slug qiladi)
- `POST /api/stores/logo`, `POST /api/stores/banner` — egasi: rasm yuklash
- Admin seller'ni tasdiqlaganda (`PATCH /api/users/:id/approve`) avtomatik do'kon yaratiladi

### To'lovlar/Komissiya (Faza 10)
- Har bir buyurtmadan `COMMISSION_RATE` (standart 5%) platforma komissiyasi ushlanadi
- Daromad: order `delivered` bo'lganda `available` bo'ladi (buyurtma bilan bog'liq)
- `GET /api/payouts/summary` — seller: mavjud/jarayonda/to'langan balans + tarix
- `POST /api/payouts` — seller: mavjud balansdan to'lov so'rash (`amount`)
- `GET /api/payouts` — admin: barcha so'rovlar (`status`, `page` filtrlari)
- `PATCH /api/payouts/:id` — admin: `paid` (tasdiqlash) yoki `rejected` (rad etish, daromad qaytadi)

### Statistika (Faza 11)
- `GET /api/stats/seller` — seller: daromad, buyurtmalar, sotilgan dona, top mahsulotlar, oxirgi 6 oy oylik daromad
- `GET /api/stats/admin` — admin: umumiy daromad, buyurtmalar, userlar/sellerlar/mahsulotlar/do'konlar soni, top sellerlar, kutilayotgan to'lovlar, oylik daromad
- Buyurtma item'lari endi `seller` snapshot'ini saqlaydi — statistika va seller balansi shu orqali hisoblanadi

### Sharh va reytinglar (Faza 12)
- `GET /api/products/:productId/reviews` — omma ochiq, sahifalangan, o'rtacha reyting bilan
- `POST /api/products/:productId/reviews` — foydalanuvchi: `{ rating: 1-5, comment? }` (bir foydalanuvchi — bitta sharh)
- `PATCH /api/products/:productId/reviews/:reviewId` — egasi tahrirlash
- `DELETE /api/products/:productId/reviews/:reviewId` — egasi yoki admin o'chirish
- Har bir o'zgarishda mahsulot `averageRating`/`ratingCount` avtomatik qayta hisoblanadi

## Faza holati

- [x] Faza 1 — Skeleton: Express+TS, Vite+React+TS, MongoDB ulash
- [x] Faza 2 — Auth: register, OTP email tasdiqlash, login, JWT refresh rotation, logout, parolni tiklash, rate limiting, 17 avtomatik test
- [x] Faza 3 — Profil + avatar upload, manzillar CRUD, seller arizasi, admin foydalanuvchi boshqaruvi (rol/blok/tasdiqlash), 16 avtomatik test
- [x] Faza 4 — Product/Category modellari + API (slug avtomatik, upload, filter/sort/pagination), 15 avtomatik test
- [x] Faza 5 — Frontend: uy sahifa, mahsulotlar ro'yxati, filter, sort, pagination, mahsulot sahifasi
- [x] Faza 6 — Cart + kupon (server + client: savat sahifasi, miqdor, kupon maydoni, nav badge), 12 avtomatik test
- [x] Faza 7 — Checkout + Stripe (COD buyurtma, Stripe Session + webhook, stock kamayishi, client checkout sahifasi), 9 avtomatik test
- [x] Faza 8 — Order tizimi + email (buyurtmalarim, admin/seller ro'yxatlari, status + email bildirishnoma), 9 avtomatik test
- [x] Faza 9 — Store/Seller moduli (do'kon sahifasi, yaratish/tahrirlash, logo/banner, seller tasdiqlashda avto-do'kon), 7 avtomatik test
- [x] Faza 10 — Payout/komissiya (seller daromadi, 5% komissiya, to'lov so'rovlari + admin tasdiqlash), 8 avtomatik test
- [x] Faza 11 — Statistika (seller + admin dashboard, top mahsulotlar/sellerlar, oylik diagramma), 4 avtomatik test
- [x] Faza 12 — Sharh va reytinglar (yulduzlar, sharhlar, o'rtacha reyting avto-hisoblash), 8 avtomatik test
- [ ] Faza 13 — Sevimlilar (wishlist)
- [ ] Faza 8 — Order tizimi + email
- [ ] Faza 9 — Store/Seller moduli
- [ ] Faza 10 — Payout/komissiya
- [ ] Faza 11 — Admin panel
- [ ] Faza 12 — Socket.io live
- [ ] Faza 13 — Premium feature'lar
- [ ] Faza 14 — Xavfsizlik + optimizatsiya
- [ ] Faza 15 — README + seed + deploy
