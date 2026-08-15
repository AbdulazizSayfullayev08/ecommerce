import Cart from '../models/Cart';
import Product from '../models/Product';
import Coupon, { ICoupon } from '../models/Coupon';
import { ApiError } from '../utils/ApiError';

export interface CartTotals {
  subtotal: number;
  discount: number;
  total: number;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function validateCoupon(code: string, subtotal: number): Promise<ICoupon> {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true });
  if (!coupon) throw new ApiError(404, 'Kupon topilmadi');

  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'Kupon muddati tugagan');
  }
  if (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'Kupon ishlatilgan');
  }
  if (coupon.minAmount > 0 && subtotal < coupon.minAmount) {
    throw new ApiError(
      400,
      `Kupon ${coupon.minAmount.toLocaleString()} so'mdan ortiq xaridda amal qiladi`
    );
  }
  return coupon;
}

export function computeDiscount(coupon: ICoupon, subtotal: number): number {
  let discount =
    coupon.type === 'percentage'
      ? roundMoney((subtotal * coupon.value) / 100)
      : roundMoney(coupon.value);
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  return Math.min(discount, subtotal);
}

function computeTotals(items: { qty: number; price: number }[], coupon?: ICoupon | null) {
  const subtotal = roundMoney(
    items.reduce((sum, it) => sum + it.price * it.qty, 0)
  );
  const discount = coupon ? computeDiscount(coupon, subtotal) : 0;
  return {
    subtotal,
    discount,
    total: roundMoney(subtotal - discount),
  };
}

function itemCount(items: { qty: number }[]): number {
  return items.reduce((sum, it) => sum + it.qty, 0);
}

async function getOrCreateCart(userId: string) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

export async function getCart(userId: string) {
  const cart = await getOrCreateCart(userId);

  const items = await Promise.all(
    cart.items.map(async (it) => {
      const product = await Product.findById(it.product)
        .populate('category', 'name slug')
        .populate('seller', 'name avatar');
      if (!product || !product.isActive) return null;
      return {
        product,
        qty: Math.min(it.qty, product.stock),
      };
    })
  );

  const validItems = items.filter((it): it is NonNullable<typeof it> => it !== null);
  const pricedItems = validItems.map((it) => ({
    qty: it.qty,
    price: it.product.price,
  }));

  const subtotal = roundMoney(pricedItems.reduce((s, it) => s + it.price * it.qty, 0));

  let coupon: ICoupon | null = null;
  if (cart.couponCode) {
    try {
      coupon = await validateCoupon(cart.couponCode, subtotal);
    } catch {
      cart.couponCode = null;
      await cart.save();
    }
  }

  const totals = computeTotals(pricedItems, coupon);

  return {
    cart: {
      _id: cart._id,
      items: validItems,
      couponCode: cart.couponCode ?? null,
      itemCount: itemCount(pricedItems),
      totals,
    },
  };
}

export async function addItem(userId: string, productId: string, qty: number) {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, 'Mahsulot topilmadi');
  }
  if (product.stock <= 0) {
    throw new ApiError(400, 'Mahsulot omborda mavjud emas');
  }

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find(
    (it) => it.product.toString() === productId.toString()
  );

  if (existing) {
    const newQty = existing.qty + qty;
    if (newQty > product.stock) {
      throw new ApiError(400, `Omborda atigi ${product.stock} dona bor`);
    }
    existing.qty = newQty;
  } else {
    if (qty > product.stock) {
      throw new ApiError(400, `Omborda atigi ${product.stock} dona bor`);
    }
    cart.items.push({ product: product._id, qty });
  }

  await cart.save();
  return getCart(userId);
}

export async function updateQty(userId: string, productId: string, qty: number) {
  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find(
    (it) => it.product.toString() === productId.toString()
  );
  if (!existing) throw new ApiError(404, 'Savatda bunday mahsulot yo\'q');

  if (qty <= 0) {
    cart.items = cart.items.filter(
      (it) => it.product.toString() !== productId.toString()
    );
  } else {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new ApiError(404, 'Mahsulot topilmadi');
    }
    if (qty > product.stock) {
      throw new ApiError(400, `Omborda atigi ${product.stock} dona bor`);
    }
    existing.qty = qty;
  }

  await cart.save();
  return getCart(userId);
}

export async function removeItem(userId: string, productId: string) {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter(
    (it) => it.product.toString() !== productId.toString()
  );
  await cart.save();
  return getCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  cart.couponCode = null;
  await cart.save();
  return getCart(userId);
}

export async function applyCoupon(userId: string, code: string) {
  const cartData = await getCart(userId);
  const subtotal = cartData.cart.totals.subtotal;
  const coupon = await validateCoupon(code, subtotal);

  const cart = await getOrCreateCart(userId);
  cart.couponCode = coupon.code;
  await cart.save();

  return getCart(userId);
}

export async function removeCoupon(userId: string) {
  const cart = await getOrCreateCart(userId);
  cart.couponCode = null;
  await cart.save();
  return getCart(userId);
}
