import type { Product } from '@/types/product';

type ProductImageSource = number | { uri: string };

export type ProductRow = {
  id?: number | string | null;
  name?: string | null;
  price?: number | string | null;
  category?: string | null;
  image?: string | null;
  inStock?: boolean | null;
  in_stock?: boolean | null;
  sizes?: string[] | string | null;
  description?: string | null;
};

export const categories = [
  { label: 'All', value: 'all' },
  { label: 'T-Shirt', value: 't-shirt' },
  { label: 'Shirt', value: 'shirt' },
  { label: 'Pant', value: 'pant' },
  { label: 'Jacket', value: 'jacket' },
] as const;

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL'];

const fallbackImage = require('@/assets/images/products/mandt-tshirt.png');

const localProductImages: Record<string, ProductImageSource> = {
  '/products/mandt-tshirt.png': require('@/assets/images/products/mandt-tshirt.png'),
  'products/mandt-tshirt.png': require('@/assets/images/products/mandt-tshirt.png'),
  'mandt-tshirt.png': require('@/assets/images/products/mandt-tshirt.png'),
  '/products/hand-sneak-tshirt.png': require('@/assets/images/products/hand-sneak-tshirt.png'),
  'products/hand-sneak-tshirt.png': require('@/assets/images/products/hand-sneak-tshirt.png'),
  'hand-sneak-tshirt.png': require('@/assets/images/products/hand-sneak-tshirt.png'),
  '/products/cuiar-tshirt.png': require('@/assets/images/products/cuiar-tshirt.png'),
  'products/cuiar-tshirt.png': require('@/assets/images/products/cuiar-tshirt.png'),
  'cuiar-tshirt.png': require('@/assets/images/products/cuiar-tshirt.png'),
  '/products/leon-dose-shirt.png': require('@/assets/images/products/leon-dose-shirt.png'),
  'products/leon-dose-shirt.png': require('@/assets/images/products/leon-dose-shirt.png'),
  'leon-dose-shirt.png': require('@/assets/images/products/leon-dose-shirt.png'),
  '/products/embroidery-gen-shirt.png': require('@/assets/images/products/embroidery-gen-shirt.png'),
  'products/embroidery-gen-shirt.png': require('@/assets/images/products/embroidery-gen-shirt.png'),
  'embroidery-gen-shirt.png': require('@/assets/images/products/embroidery-gen-shirt.png'),
};

export function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

export function getCategoryLabel(value: string) {
  return categories.find((category) => category.value === value)?.label ?? value;
}

export function getProductImageSource(image?: string | null): ProductImageSource {
  if (!image) {
    return fallbackImage;
  }

  const trimmed = image.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return { uri: trimmed };
  }

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return localProductImages[trimmed] ?? localProductImages[normalized] ?? fallbackImage;
}

export function normalizeProduct(row: ProductRow): Product {
  return {
    id: String(row.id ?? ''),
    name: row.name?.trim() || 'Untitled product',
    price: normalizePrice(row.price),
    category: row.category?.trim() || 'uncategorized',
    image: row.image?.trim() || '',
    inStock: row.inStock ?? row.in_stock ?? true,
    sizes: normalizeSizes(row.sizes),
    description: row.description?.trim() || 'No description available.',
  };
}

export function normalizeProducts(rows?: ProductRow[] | null): Product[] {
  return (rows ?? []).map(normalizeProduct).filter((product) => product.id.length > 0);
}

function normalizePrice(price: ProductRow['price']) {
  if (typeof price === 'number') {
    return price;
  }

  const parsed = Number(price ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSizes(sizes: ProductRow['sizes']) {
  if (Array.isArray(sizes)) {
    const normalized = sizes.map(String).map((size) => size.trim()).filter(Boolean);
    return normalized.length > 0 ? normalized : DEFAULT_SIZES;
  }

  if (typeof sizes === 'string') {
    const normalized = sizes
      .replace(/[{}"]/g, '')
      .split(',')
      .map((size) => size.trim())
      .filter(Boolean);

    return normalized.length > 0 ? normalized : DEFAULT_SIZES;
  }

  return DEFAULT_SIZES;
}
