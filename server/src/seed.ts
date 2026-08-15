import { connectDB, disconnectDB } from './config/db';
import User from './models/User';
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
