import express, { Express } from 'express';
import path from 'path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { corsMiddleware } from './middlewares/cors';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import routes from './routes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import cartRoutes from './routes/cartRoutes';
import couponRoutes from './routes/couponRoutes';
import checkoutRoutes from './routes/checkoutRoutes';
import orderRoutes from './routes/orderRoutes';
import storeRoutes from './routes/storeRoutes';
import payoutRoutes from './routes/payoutRoutes';
import statsRoutes from './routes/statsRoutes';
import reviewRoutes from './routes/reviewRoutes';

export function createApp(): Express {
  const app: Express = express();

  app.use(helmet());
  app.use(corsMiddleware);
  app.use(
    express.json({
      limit: '1mb',
      verify: (req: express.Request, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(
    `/${env.upload.dir}`,
    express.static(path.join(process.cwd(), env.upload.dir))
  );

  app.use('/api', routes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/checkout', checkoutRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/stores', storeRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/products/:productId/reviews', reviewRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
