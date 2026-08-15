import { Request, Response, NextFunction } from 'express';
import { createReview, deleteReview, listReviews, updateReview } from '../services/reviewService';
import { UserRole } from '../types';

export async function listReviewsController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listReviews(req.params.productId as string, req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createReviewController(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await createReview(
      req.params.productId as string,
      req.user!.userId,
      req.body.rating,
      req.body.comment
    );
    res.status(201).json({ success: true, data: { review } });
  } catch (err) {
    next(err);
  }
}

export async function updateReviewController(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await updateReview(
      req.params.productId as string,
      req.params.reviewId as string,
      req.user!.userId,
      { rating: req.body.rating, comment: req.body.comment }
    );
    res.status(200).json({ success: true, data: { review } });
  } catch (err) {
    next(err);
  }
}

export async function deleteReviewController(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteReview(
      req.params.productId as string,
      req.params.reviewId as string,
      req.user!.userId,
      req.user!.role === UserRole.ADMIN
    );
    res.status(200).json({ success: true, message: 'Sharh o\'chirildi' });
  } catch (err) {
    next(err);
  }
}
