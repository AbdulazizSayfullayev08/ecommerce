import { env } from './config/env';
import { connectDB } from './config/db';
import { createApp } from './app';

const app = createApp();

async function start(): Promise<void> {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`[server] Running in ${env.nodeEnv} mode on port ${env.port}`);
  });

  const shutdown = async (): Promise<void> => {
    console.log('[server] Shutting down...');
    server.close(async () => {
      const { disconnectDB } = await import('./config/db');
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
