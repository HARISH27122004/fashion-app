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

  decrementFromCart: (
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

  // ───────────────────────────────────
  // MERGE GUEST CART → USER CART
  // ───────────────────────────────────
  async function mergeGuestCart(
    userId: string
  ) {
    const guestCart =
      localStorage.getItem(
        "guest-cart"
      );

    if (!guestCart) return;

    const parsedCart: CartItem[] =
      JSON.parse(guestCart);

    if (
      parsedCart.length === 0
    )
      return;

    // FETCH EXISTING USER CART
    const {
      data: existingItems,
    } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", userId);

    for (const guestItem of parsedCart) {
      const existing =
        existingItems?.find(
          (item) =>
            item.product_id ===
            guestItem.productId
        );

      // UPDATE EXISTING
      if (existing) {
        await supabase
          .from("cart_items")
          .update({
            quantity:
              existing.quantity +
              guestItem.quantity,
          })
          .eq(
            "id",
            existing.id
          );
      }

      // INSERT NEW
      else {
        await supabase
          .from("cart_items")
          .insert([
            {
              user_id:
                userId,

              product_id:
                guestItem.productId,

              quantity:
                guestItem.quantity,
            },
          ]);
      }
    }

    // CLEAR GUEST CART
    localStorage.removeItem(
      "guest-cart"
    );
  }

  // ───────────────────────────────────
  // LOAD CART
  // ───────────────────────────────────
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
          // SIGNED OUT
          if (
            event === "SIGNED_OUT"
          ) {
            await loadCart();
          }

          // SIGNED IN
          if (
            event === "SIGNED_IN"
          ) {
            const {
              data: { user },
            } =
              await supabase.auth.getUser();

            if (user) {
              // MERGE GUEST CART
              await mergeGuestCart(
                user.id
              );
            }

            await loadCart();
          }
        }
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  // ───────────────────────────────────
  // LOAD CART
  // ───────────────────────────────────
  async function loadCart() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // GUEST USER
    if (!user) {
      const guestCart =
        localStorage.getItem(
          "guest-cart"
        );

      if (guestCart) {
        setCart(
          JSON.parse(
            guestCart
          )
        );
      } else {
        setCart([]);
      }

      return;
    }

    // LOGGED USER
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

  // ───────────────────────────────────
  // ADD TO CART
  // ───────────────────────────────────
  async function addToCart(
    productId: string,
    quantity: number = 1
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // GUEST USER
    if (!user) {
      const existing = cart.find(
        (item) =>
          item.productId ===
          productId
      );

      let updatedCart:
        CartItem[];

      if (existing) {
        updatedCart = cart.map(
          (item) =>
            item.productId ===
            productId
              ? {
                  ...item,
                  quantity:
                    item.quantity +
                    quantity,
                }
              : item
        );
      } else {
        updatedCart = [
          ...cart,
          {
            productId,
            quantity,
          },
        ];
      }

      setCart(updatedCart);

      localStorage.setItem(
        "guest-cart",
        JSON.stringify(
          updatedCart
        )
      );

      return;
    }

    // LOGGED USER
    const existing = cart.find(
      (item) =>
        item.productId ===
        productId
    );

    if (existing) {
      await updateQuantity(
        productId,
        existing.quantity +
          quantity
      );

      return;
    }

    const { error } =
      await supabase
        .from("cart_items")
        .insert([
          {
            user_id: user.id,
            product_id:
              productId,
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

  // ───────────────────────────────────
  // DECREMENT
  // ───────────────────────────────────
  async function decrementFromCart(
    productId: string
  ) {
    const existing = cart.find(
      (item) =>
        item.productId ===
        productId
    );

    if (!existing) return;

    await updateQuantity(
      productId,
      existing.quantity - 1
    );
  }

  // ───────────────────────────────────
  // REMOVE
  // ───────────────────────────────────
  async function removeFromCart(
    productId: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // GUEST USER
    if (!user) {
      const updatedCart =
        cart.filter(
          (item) =>
            item.productId !==
            productId
        );

      setCart(updatedCart);

      localStorage.setItem(
        "guest-cart",
        JSON.stringify(
          updatedCart
        )
      );

      return;
    }

    // LOGGED USER
    const { error } =
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq(
          "product_id",
          productId
        );

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

  // ───────────────────────────────────
  // UPDATE QUANTITY
  // ───────────────────────────────────
  async function updateQuantity(
    productId: string,
    quantity: number
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (quantity <= 0) {
      await removeFromCart(
        productId
      );

      return;
    }

    // GUEST USER
    if (!user) {
      const updatedCart =
        cart.map((item) =>
          item.productId ===
          productId
            ? {
                ...item,
                quantity,
              }
            : item
        );

      setCart(updatedCart);

      localStorage.setItem(
        "guest-cart",
        JSON.stringify(
          updatedCart
        )
      );

      return;
    }

    // LOGGED USER
    const { error } =
      await supabase
        .from("cart_items")
        .update({
          quantity,
        })
        .eq("user_id", user.id)
        .eq(
          "product_id",
          productId
        );

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

  // ───────────────────────────────────
  // CLEAR CART
  // ───────────────────────────────────
  async function clearCart() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // GUEST USER
    if (!user) {
      setCart([]);

      localStorage.removeItem(
        "guest-cart"
      );

      return;
    }

    // LOGGED USER
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

  // ───────────────────────────────────
  // GET QUANTITY
  // ───────────────────────────────────
  function getQuantity(
    productId: string
  ) {
    const item = cart.find(
      (item) =>
        item.productId ===
        productId
    );

    return item
      ? item.quantity
      : 0;
  }

  // ───────────────────────────────────
  // TOTAL ITEMS
  // ───────────────────────────────────
  const totalItems =
    cart.reduce(
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

        decrementFromCart,

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