import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { config } from 'dotenv';

config({ path: '.env.test' });

const TEST_DB_SUFFIX = 'ecommerce_test';

async function connectTestDB(): Promise<void> {
  let uri = process.env.MONGO_URI || '';
  if (!uri) {
    // fallback: build from main .env
    config({ path: '.env' });
    uri = process.env.MONGO_URI || '';
  }
  if (!uri.includes('/')) throw new Error('MONGO_URI not found for tests');

  // switch to the test database
  const base = uri.split('/');
  base[base.length - 1] = TEST_DB_SUFFIX;
  const testUri = base.join('/');

  await mongoose.connect(testUri);
}

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});
