import { Request, Response } from 'express';
import {
  addProductImages,
  createProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductBySlug,
  listAdminProducts,
  listProducts,
  listSellerProducts,
  toggleProductActive,
  updateProduct,
} from '../services/productService';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '../types';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await listProducts({
    q: req.query.q as string | undefined,
    category: req.query.category as string | undefined,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    seller: req.query.seller as string | undefined,
    inStock: req.query.inStock as 'true' | 'false' | undefined,
    isFeatured: req.query.isFeatured as 'true' | 'false' | undefined,
    sort: req.query.sort as string | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.status(200).json({ success: true, data: result });
});

export const getFeatured = asyncHandler(async (req: Request, res: Response) => {
  const products = await getFeaturedProducts(Number(req.query.limit) || 8);
  res.status(200).json({ success: true, data: { products } });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await getProductBySlug(req.params.slug as string);
  res.status(200).json({ success: true, data: { product } });
});

export const getMyProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await listSellerProducts(req.user!.userId, {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.status(200).json({ success: true, data: result });
});

export const getAdminProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await listAdminProducts({
    q: req.query.q as string | undefined,
    seller: req.query.seller as string | undefined,
    isActive: req.query.isActive as 'true' | 'false' | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.status(200).json({ success: true, data: result });
});

export const createProductController = asyncHandler(
  async (req: Request, res: Response) => {
    const isAdmin = req.user!.role === UserRole.ADMIN;
    const product = await createProduct(req.user!.userId, isAdmin, req.body);
    res.status(201).json({ success: true, data: { product } });
  }
);

export const updateProductController = asyncHandler(
  async (req: Request, res: Response) => {
    const isAdmin = req.user!.role === UserRole.ADMIN;
    const product = await updateProduct(
      req.params.id as string,
      req.user!.userId,
      isAdmin,
      req.body
    );
    res.status(200).json({ success: true, data: { product } });
  }
);

export const deleteProductController = asyncHandler(
  async (req: Request, res: Response) => {
    const isAdmin = req.user!.role === UserRole.ADMIN;
    const product = await deleteProduct(
      req.params.id as string,
      req.user!.userId,
      isAdmin
    );
    res.status(200).json({ success: true, data: { product } });
  }
);

export const setProductActive = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === UserRole.ADMIN;
  const product = await toggleProductActive(
    req.params.id as string,
    req.user!.userId,
    isAdmin,
    req.body.isActive
  );
  res.status(200).json({ success: true, data: { product } });
});

export const uploadProductImagesController = asyncHandler(
  async (req: Request, res: Response) => {
    const isAdmin = req.user!.role === UserRole.ADMIN;
    const product = await addProductImages(
      req.params.id as string,
      req.user!.userId,
      isAdmin,
      req.files as Express.Multer.File[]
    );
    res.status(200).json({ success: true, data: { product } });
  }
);
