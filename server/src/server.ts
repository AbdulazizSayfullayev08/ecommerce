import express, { Express } from 'express';
import path from 'path';
import helmet from 'helmet';
import { env } from './config/env';
import { connectDB } from './config/db';
import { corsMiddleware } from './middlewares/cors';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import routes from './routes';

const app: Express = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(`/${env.upload.dir}`, express.static(path.join(process.cwd(), env.upload.dir)));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

async function start(): Promise<void> {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`[server] Running in ${env.nodeEnv} mode on port ${env.port}`);
  });

  const shutdown = async (): Promise<void> => {
    console.log('[server] Shutting down...');
    server.close(async () => {
      await import('./config/db').then((m) => m.disconnectDB());
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
