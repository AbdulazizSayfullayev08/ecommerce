import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { env } from './env';

const uploadDir = path.join(process.cwd(), env.upload.dir);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowed = /image\/(jpeg|jpg|png|webp|gif)/;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Faqat rasm fayllari yuklash mumkin (jpg, png, webp, gif)'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: env.upload.maxSizeMb * 1024 * 1024 },
  fileFilter,
});
