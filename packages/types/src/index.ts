// We re-export the Prisma generated types here so that both frontend and backend can share them.
export * from "@repo/database";

// You can also add custom types related to your UI/App logic here
export interface CartItem {
  productId: string;
  size: string;
  quantity: number;
}