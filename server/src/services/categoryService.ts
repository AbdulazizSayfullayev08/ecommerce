import Category from '../models/Category';
import Product from '../models/Product';
import { ApiError } from '../utils/ApiError';

export interface CategoryInput {
  name: string;
  description?: string;
  image?: string;
  parent?: string;
  isActive?: boolean;
  order?: number;
}

export async function listCategories(includeInactive = false) {
  const filter = includeInactive ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ order: 1, name: 1 });

  const roots = categories.filter((c) => !c.parent);
  const children = categories.filter((c) => c.parent);

  return roots.map((root) => ({
    ...root.toObject(),
    children: children.filter((c) => c.parent?.toString() === root._id.toString()),
  }));
}

export async function getCategoryBySlug(slug: string) {
  const category = await Category.findOne({ slug, isActive: true });
  if (!category) throw new ApiError(404, 'Kategoriya topilmadi');
  return category;
}

export async function createCategory(input: CategoryInput) {
  if (input.parent) {
    const parent = await Category.findById(input.parent);
    if (!parent) throw new ApiError(400, 'Ota kategoriya topilmadi');
  }

  const existing = await Category.findOne({ name: input.name.trim() });
  if (existing) throw new ApiError(409, 'Bu nomdagi kategoriya mavjud');

  const category = await Category.create({
    name: input.name,
    description: input.description,
    image: input.image,
    parent: input.parent || null,
    isActive: input.isActive ?? true,
    order: input.order ?? 0,
  });

  return category;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Kategoriya topilmadi');

  if (input.name !== undefined && input.name.trim() !== category.name) {
    const existing = await Category.findOne({ name: input.name.trim() });
    if (existing && existing._id.toString() !== id) {
      throw new ApiError(409, 'Bu nomdagi kategoriya mavjud');
    }
    category.name = input.name.trim();
  }

  if (input.parent !== undefined) {
    if (input.parent === id) {
      throw new ApiError(400, 'Kategoriya o\'ziga bog\'lana olmaydi');
    }
    if (input.parent) {
      const parent = await Category.findById(input.parent);
      if (!parent) throw new ApiError(400, 'Ota kategoriya topilmadi');
      category.parent = parent._id;
    } else {
      category.parent = null;
    }
  }

  if (input.description !== undefined) category.description = input.description;
  if (input.image !== undefined) category.image = input.image;
  if (input.isActive !== undefined) category.isActive = input.isActive;
  if (input.order !== undefined) category.order = input.order;

  await category.save();
  return category;
}

export async function deleteCategory(id: string) {
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Kategoriya topilmadi');

  const productsCount = await Product.countDocuments({ category: id });
  if (productsCount > 0) {
    throw new ApiError(400, 'Kategoriyada mahsulotlar mavjud — avval ularni o\'chiring');
  }

  const childrenCount = await Category.countDocuments({ parent: id });
  if (childrenCount > 0) {
    throw new ApiError(400, 'Kategoriyada kichik kategoriyalar mavjud');
  }

  await category.deleteOne();
  return category;
}
