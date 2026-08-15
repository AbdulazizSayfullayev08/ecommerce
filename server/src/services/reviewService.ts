import Review from '../models/Review';
import Product from '../models/Product';
import { ApiError } from '../utils/ApiError';
import { Types } from 'mongoose';

export interface ReviewListResult {
  reviews: ReturnType<typeof Review.prototype.toObject>[];
  total: number;
  page: number;
  pages: number;
  averageRating: number;
  ratingCount: number;
}

async function recomputeRating(productId: string) {
  const [result] = await Review.aggregate([
    { $match: { product: new Types.ObjectId(productId) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    averageRating: result ? Math.round(result.avg * 10) / 10 : 0,
    ratingCount: result?.count ?? 0,
  });
}

export async function listReviews(
  productId: string,
  query: { page?: number; limit?: number } = {}
): Promise<ReviewListResult> {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Mahsulot topilmadi');

  const page = query.page ?? 1;
  const limit = query.limit ?? 5;

  const [reviews, total] = await Promise.all([
    Review.find({ product: productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments({ product: productId }),
  ]);

  return {
    reviews,
    total,
    page,
    pages: Math.ceil(total / limit),
    averageRating: product.averageRating,
    ratingCount: product.ratingCount,
  };
}

export async function createReview(productId: string, userId: string, rating: number, comment?: string) {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Mahsulot topilmadi');

  const existing = await Review.findOne({ product: productId, user: userId });
  if (existing) {
    throw new ApiError(400, 'Siz bu mahsulotga allaqachon sharh qoldirgansiz');
  }

  const review = await Review.create({
    product: productId,
    user: userId,
    rating,
    comment: comment?.trim() || undefined,
  });

  await recomputeRating(productId);
  return review;
}

export async function updateReview(
  productId: string,
  reviewId: string,
  userId: string,
  data: { rating?: number; comment?: string }
) {
  const review = await Review.findOne({ _id: reviewId, product: productId });
  if (!review) throw new ApiError(404, 'Sharh topilmadi');
  if (review.user.toString() !== userId) throw new ApiError(403, 'Faqat o\'z sharhingizni tahrirlay olasiz');

  if (data.rating !== undefined) review.rating = data.rating;
  if (data.comment !== undefined) review.comment = data.comment?.trim() || undefined;
  await review.save();

  await recomputeRating(productId);
  return review;
}

export async function deleteReview(productId: string, reviewId: string, userId: string, isAdmin = false) {
  const review = await Review.findOne({ _id: reviewId, product: productId });
  if (!review) throw new ApiError(404, 'Sharh topilmadi');
  if (!isAdmin && review.user.toString() !== userId) {
    throw new ApiError(403, 'Faqat o\'z sharhingizni o\'chira olasiz');
  }

  await review.deleteOne();
  await recomputeRating(productId);
}
