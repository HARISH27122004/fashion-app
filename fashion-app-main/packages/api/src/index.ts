import type { Product } from "@repo/types";

// This will later contain functions to fetch from your Next.js API
// E.g.
// export const getProducts = async (): Promise<Product[]> => {
//   const res = await fetch('http://localhost:3000/api/products');
//   return res.json();
// }

export const helloSharedApi = () => "API SDK is working!";