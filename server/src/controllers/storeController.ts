import { Request, Response, NextFunction } from 'express';
import {
  createStore,
  getMyStore,
  getStoreBySlug,
  listStores,
  setStoreImage,
  updateStore,
} from '../services/storeService';

export async function listStoresController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listStores(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function storeBySlugController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getStoreBySlug(req.params.slug as string);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function myStoreController(req: Request, res: Response, next: NextFunction) {
  try {
    const store = await getMyStore(req.user!.userId);
    res.status(200).json({ success: true, data: { store } });
  } catch (err) {
    next(err);
  }
}

export async function createStoreController(req: Request, res: Response, next: NextFunction) {
  try {
    const store = await createStore(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: { store } });
  } catch (err) {
    next(err);
  }
}

export async function updateStoreController(req: Request, res: Response, next: NextFunction) {
  try {
    const store = await updateStore(req.user!.userId, req.body);
    res.status(200).json({ success: true, data: { store } });
  } catch (err) {
    next(err);
  }
}

export async function storeLogoController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new Error('Fayl yuklanmadi');
    const store = await setStoreImage(req.user!.userId, 'logo', req.file.filename);
    res.status(200).json({ success: true, data: { store } });
  } catch (err) {
    next(err);
  }
}

export async function storeBannerController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new Error('Fayl yuklanmadi');
    const store = await setStoreImage(req.user!.userId, 'banner', req.file.filename);
    res.status(200).json({ success: true, data: { store } });
  } catch (err) {
    next(err);
  }
}
