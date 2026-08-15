import { apiRequest } from '@/utils/api'
import type { Category, PaginatedProducts, Product, ProductFilters } from '@/types'

export interface CategoryListResponse {
  categories: Category[]
}

export interface ProductListResponse extends PaginatedProducts {}

export interface ProductResponse {
  product: Product
}

export interface FeaturedResponse {
  products: Product[]
}

export const catalogApi = {
  getCategories: (all = false) =>
    apiRequest<CategoryListResponse>(`/categories${all ? '?all=true' : ''}`),

  getCategory: (slug: string) =>
    apiRequest<{ category: Category }>(`/categories/${slug}`),

  getProducts: (filters: ProductFilters = {}) => {
    const qs = new URLSearchParams()
    if (filters.q) qs.set('q', filters.q)
    if (filters.category) qs.set('category', filters.category)
    if (filters.minPrice !== undefined) qs.set('minPrice', String(filters.minPrice))
    if (filters.maxPrice !== undefined) qs.set('maxPrice', String(filters.maxPrice))
    if (filters.sort) qs.set('sort', filters.sort)
    if (filters.page) qs.set('page', String(filters.page))
    if (filters.limit) qs.set('limit', String(filters.limit))
    const query = qs.toString()
    return apiRequest<ProductListResponse>(`/products${query ? `?${query}` : ''}`)
  },

  getFeatured: (limit = 8) =>
    apiRequest<FeaturedResponse>(`/products/featured?limit=${limit}`),

  getProduct: (slug: string) => apiRequest<ProductResponse>(`/products/${slug}`),
}
