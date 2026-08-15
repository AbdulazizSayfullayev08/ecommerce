import { Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

function createUploader(dir: string, maxCount?: number) {
  const targetDir = path.join(process.cwd(), env.upload.dir, dir);
  fs.mkdirSync(targetDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, targetDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, unique);
    },
  });

  const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = /^image\/(jpeg|png|webp|gif)$/;
    if (!allowed.test(file.mimetype)) {
      cb(new ApiError(400, 'Faqat rasm yuklash mumkin (JPG, PNG, WebP, GIF)'));
      return;
    }
    cb(null, true);
  };

  const multerInstance = multer({
    storage,
    fileFilter,
    limits: { fileSize: env.upload.maxSizeMb * 1024 * 1024 },
  });

  return {
    single: multerInstance.single('avatar'),
    array: maxCount ? multerInstance.array('images', maxCount) : multerInstance.array('images'),
  };
}

export const avatarUpload = createUploader('avatars');
export const productImageUpload = createUploader('products', 5);
