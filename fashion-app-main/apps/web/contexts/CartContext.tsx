"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

import { supabase } from "@/lib/supabase";

type CartItem = {
  productId: string;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];

  addToCart: (
    productId: string,
    quantity?: number
  ) => Promise<void>;

  removeFromCart: (
    productId: string
  ) => Promise<void>;

  updateQuantity: (
    productId: string,
    quantity: number
  ) => Promise<void>;

  clearCart: () => Promise<void>;

  getQuantity: (
    productId: string
  ) => number;

  totalItems: number;
};

const CartContext =
  createContext<
    CartContextType | undefined
  >(undefined);

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] =
    useState<CartItem[]>([]);

  // LOAD CART
 useEffect(() => {
  let mounted = true;

  async function init() {
    if (!mounted) return;

    await loadCart();
  }

  init();

  const {
    data: { subscription },
  } =
    supabase.auth.onAuthStateChange(
      async (event) => {
        // LOGOUT
        if (
          event === "SIGNED_OUT"
        ) {
          setCart([]);
        }

        // LOGIN
        if (
          event === "SIGNED_IN"
        ) {
          await loadCart();
        }
      }
    );

  return () => {
    mounted = false;

    subscription.unsubscribe();
  };
}, []);

  // LOAD USER CART
  async function loadCart() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCart([]);
      return;
    }

    const { data, error } =
      await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id);

    if (error) {
      console.log(error);
      return;
    }

    if (data) {
      setCart(
        data.map((item) => ({
          productId:
            item.product_id,

          quantity:
            item.quantity,
        }))
      );
    }
  }

  // ADD TO CART
  async function addToCart(
    productId: string,
    quantity: number = 1
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const existing = cart.find(
      (item) =>
        item.productId === productId
    );

    // UPDATE EXISTING
    if (existing) {
      const newQuantity =
        existing.quantity +
        quantity;

      await updateQuantity(
        productId,
        newQuantity
      );

      return;
    }

    // INSERT NEW
    const { error } =
      await supabase
        .from("cart_items")
        .insert([
          {
            user_id: user.id,

            product_id: productId,

            quantity,
          },
        ]);

    if (error) {
      console.log(error);
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        productId,
        quantity,
      },
    ]);
  }

  // REMOVE ITEM
  async function removeFromCart(
    productId: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } =
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

    if (error) {
      console.log(error);
      return;
    }

    setCart((prev) =>
      prev.filter(
        (item) =>
          item.productId !==
          productId
      )
    );
  }

  // UPDATE QUANTITY
  async function updateQuantity(
    productId: string,
    quantity: number
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    if (quantity <= 0) {
      await removeFromCart(
        productId
      );

      return;
    }

    const { error } =
      await supabase
        .from("cart_items")
        .update({
          quantity,
        })
        .eq("user_id", user.id)
        .eq("product_id", productId);

    if (error) {
      console.log(error);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId ===
        productId
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  }

  // CLEAR CART
  async function clearCart() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } =
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

    if (error) {
      console.log(error);
      return;
    }

    setCart([]);
  }

  // GET QUANTITY
  function getQuantity(
    productId: string
  ) {
    const item = cart.find(
      (item) =>
        item.productId === productId
    );

    return item
      ? item.quantity
      : 0;
  }

  // TOTAL ITEMS
  const totalItems = cart.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,

        addToCart,

        removeFromCart,

        updateQuantity,

        clearCart,

        getQuantity,

        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used within CartProvider"
    );
  }

  return context;
}