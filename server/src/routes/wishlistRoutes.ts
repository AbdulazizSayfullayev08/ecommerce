import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { z } from 'zod';
import {
  addToWishlist,
  clearWishlist,
  getWishlist,
  getWishlistIds,
  removeFromWishlist,
} from '../services/wishlistService';
import { Request, Response, NextFunction } from 'express';

const addItemSchema = z.object({
  productId: z.string().min(1, 'Mahsulot ID talab qilinadi'),
});

const router = Router();

router.use(protect);

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getWishlist(_req.user!.userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/ids', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = await getWishlistIds(req.user!.userId);
    res.status(200).json({ success: true, data: { ids } });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/items',
  validate(addItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await addToWishlist(req.user!.userId, req.body.productId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/items/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await removeFromWishlist(req.user!.userId, req.params.productId as string);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await clearWishlist(req.user!.userId);
    res.status(200).json({ success: true, message: 'Sevimlilar tozalandi' });
  } catch (err) {
    next(err);
  }
});

export default router;
