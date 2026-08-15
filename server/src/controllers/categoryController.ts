import { Request, Response } from 'express';
import {
  createCategory,
  deleteCategory,
  getCategoryBySlug,
  listCategories,
  updateCategory,
} from '../services/categoryService';
import { asyncHandler } from '../utils/asyncHandler';

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query.all === 'true';
  const categories = await listCategories(includeInactive);
  res.status(200).json({ success: true, data: { categories } });
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await getCategoryBySlug(req.params.slug as string);
  res.status(200).json({ success: true, data: { category } });
});

export const createCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await createCategory(req.body);
    res.status(201).json({ success: true, data: { category } });
  }
);

export const updateCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await updateCategory(req.params.id as string, req.body);
    res.status(200).json({ success: true, data: { category } });
  }
);

export const deleteCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await deleteCategory(req.params.id as string);
    res.status(200).json({ success: true, data: { category } });
  }
);
