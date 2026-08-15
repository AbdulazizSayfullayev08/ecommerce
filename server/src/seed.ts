import { connectDB, disconnectDB } from './config/db';
import User from './models/User';
import Category from './models/Category';
import Product from './models/Product';
import { UserRole } from './types';

const seedUsers = [
  {
    name: 'Admin',
    email: 'admin@ecommerce.local',
    password: 'Admin12345',
    role: UserRole.ADMIN,
    isVerified: true,
    isApproved: true,
  },
  {
    name: 'Seller Demo',
    email: 'seller@ecommerce.local',
    password: 'Seller12345',
    role: UserRole.SELLER,
    isVerified: true,
    isApproved: true,
  },
  {
    name: 'Customer Demo',
    email: 'customer@ecommerce.local',
    password: 'Customer12345',
    role: UserRole.CUSTOMER,
    isVerified: true,
    isApproved: false,
  },
];

const seedCategories = [
  { name: 'Elektronika', description: 'Telefon, noutbuk va boshqa qurilmalar' },
  { name: 'Kiyim', description: 'Erkaklar, ayollar va bolalar kiyimlari' },
  { name: 'Uy jihozlari', description: 'Oshxona va uy-ro\'zg\'or buyumlari' },
  { name: 'Sport', description: 'Sport anjomlari va kiyimlari' },
];

const seedProducts = [
  {
    name: 'Smartfon X200',
    description: '6.7 dyuymli ekran, 128 GB xotira, 5000 mAh batareya',
    brand: 'Texno',
    price: 2500000,
    compareAtPrice: 3000000,
    stock: 15,
    sku: 'TX-X200',
    isFeatured: true,
  },
  {
    name: 'Noutbuk Pro 15',
    description: '16 GB RAM, 512 GB SSD, 15.6 dyuymli FullHD displey',
    brand: 'Techbook',
    price: 8500000,
    stock: 8,
    sku: 'TB-PRO15',
    isFeatured: true,
  },
  {
    name: 'Simsiz quloqchin',
    description: 'Bluetooth 5.3, shovqin o\'chirish, 24 soat ishlash',
    brand: 'SoundX',
    price: 450000,
    compareAtPrice: 600000,
    stock: 50,
    sku: 'SX-WB1',
  },
  {
    name: 'Erkaklar sport kurtka',
    description: 'Suv o\'tkazmaydigan, yengil va issiq sport kurtkasi',
    brand: 'SportWear',
    price: 350000,
    stock: 30,
    sku: 'SW-JK1',
  },
];

async function seed(): Promise<void> {
  await connectDB();

  for (const data of seedUsers) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      console.log(`[seed] Mavjud: ${data.email}`);
      continue;
    }
    await User.create(data);
    console.log(`[seed] Yaratildi: ${data.email} (${data.role})`);
  }

  const seller = await User.findOne({ email: 'seller@ecommerce.local' });

  for (const data of seedCategories) {
    const existing = await Category.findOne({ name: data.name });
    if (existing) {
      console.log(`[seed] Mavjud kategoriya: ${data.name}`);
      continue;
    }
    await Category.create(data);
    console.log(`[seed] Kategoriya yaratildi: ${data.name}`);
  }

  if (seller && (await Product.countDocuments()) === 0) {
    const categories = await Category.find({ isActive: true });

    for (const data of seedProducts) {
      const category = categories.find((c) => {
        if (data.name.includes('Smartfon') || data.name.includes('Noutbuk') || data.name.includes('quloqchin'))
          return c.name === 'Elektronika';
        return c.name === 'Kiyim';
      });

      if (!category) continue;

      await Product.create({
        seller: seller._id,
        category: category._id,
        ...data,
      });
      console.log(`[seed] Mahsulot yaratildi: ${data.name}`);
    }
  } else {
    console.log('[seed] Mahsulotlar allaqachon mavjud yoki seller topilmadi');
  }

  console.log('\n[seed] Tayyor! Kirish uchun:');
  for (const u of seedUsers) {
    console.log(`  ${u.role.padEnd(8)} | ${u.email} | ${u.password}`);
  }

  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Xatolik:', err);
  process.exit(1);
});
