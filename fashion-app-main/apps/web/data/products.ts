export interface Product {
  id: string;
  name: string;
  price: number;
  category: "all" | "t-shirt" | "shirt" | "pant" | "jacket";
  image: string;
  inStock: boolean;
  sizes: string[];
  description: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Mandt T-Shirt",
    price: 125.0,
    category: "t-shirt",
    image: "/products/mandt-tshirt.png",
    inStock: true,
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    description:
      "Discover our latest premium graphic t-shirt, meticulously crafted with bold abstract designs that merge contemporary art and streetwear culture. Perfect for making a statement, this oversized tee features a striking blue pattern on premium cotton.",
  },
  {
    id: "2",
    name: "Hand Sneak T-Shirt",
    price: 118.0,
    category: "t-shirt",
    image: "/products/hand-sneak-tshirt.png",
    inStock: true,
    sizes: ["S", "M", "L", "XL", "2XL"],
    description:
      "A bold expression of urban artistry, the Hand Sne.ak T-Shirt features dynamic blue brush strokes across a premium cream canvas. Crafted from heavyweight cotton for a structured, oversized silhouette that defines modern streetwear.",
  },
  {
    id: "3",
    name: "Cuiar T-Shirt",
    price: 109.0,
    category: "t-shirt",
    image: "/products/cuiar-tshirt.png",
    inStock: true,
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    description:
      "Embrace the vintage aesthetic with this olive-toned graphic tee. The Cuiar features classic collegiate-inspired typography on a relaxed fit silhouette, paired perfectly with cargo pants for an effortlessly cool streetwear look.",
  },
  {
    id: "4",
    name: "Leon Dose Shirt",
    price: 188.0,
    category: "shirt",
    image: "/products/leon-dose-shirt.png",
    inStock: true,
    sizes: ["M", "L", "XL", "2XL"],
    description:
      "Minimalist luxury meets understated design. The Leon Dose features a clean beige palette with a subtle back logo detail, crafted from premium organic cotton. An essential piece for the modern wardrobe that speaks volumes through simplicity.",
  },
  {
    id: "5",
    name: "Embroidery Gen Shirt",
    price: 126.0,
    category: "shirt",
    image: "/products/embroidery-gen-shirt.png",
    inStock: true,
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    description:
      "Discover our latest premium embroidered shirt, meticulously crafted with detailed designs that merge style and tradition. Ideal for various occasions, from a formal evening out to a casual day, this shirt adds a unique finish to your wardrobe.",
  },
];

export const categories = [
  { label: "All", value: "all" },
  { label: "T-Shirt", value: "t-shirt" },
  { label: "Shirt", value: "shirt" },
  { label: "Pant", value: "pant" },
  { label: "Jacket", value: "jacket" },
] as const;

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  if (category === "all") return products;
  return products.filter((p) => p.category === category);
}
