"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

import { supabase } from "@/lib/supabase";

type Bookmark = {
  productId: string;
};

type BookmarkContextType = {
  bookmarks: Bookmark[];

  addBookmark: (
    productId: string
  ) => Promise<void>;

  removeBookmark: (
    productId: string
  ) => Promise<void>;

  isBookmarked: (
    productId: string
  ) => boolean;

  toggleBookmark: (
    productId: string
  ) => Promise<void>;
};

const BookmarkContext =
  createContext<
    BookmarkContextType | undefined
  >(undefined);

export function BookmarkProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [bookmarks, setBookmarks] =
    useState<Bookmark[]>([]);

  // LOAD BOOKMARKS
useEffect(() => {
  let mounted = true;

  async function init() {
    if (!mounted) return;

    await loadBookmarks();
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
          setBookmarks([]);
        }

        // LOGIN
        if (
          event === "SIGNED_IN"
        ) {
          await loadBookmarks();
        }
      }
    );

  return () => {
    mounted = false;

    subscription.unsubscribe();
  };
}, []);

  async function loadBookmarks() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setBookmarks([]);
      return;
    }

    const { data, error } =
      await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id);

    if (error) {
      console.log(error);
      return;
    }

    if (data) {
      setBookmarks(
        data.map((item) => ({
          productId:
            item.product_id,
        }))
      );
    }
  }

  // ADD BOOKMARK
  async function addBookmark(
    productId: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } =
      await supabase
        .from("bookmarks")
        .insert([
          {
            user_id: user.id,
            product_id: productId,
          },
        ]);

    if (error) {
      console.log(error);
      return;
    }

    setBookmarks((prev) => [
      ...prev,
      { productId },
    ]);
  }

  // REMOVE BOOKMARK
  async function removeBookmark(
    productId: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } =
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

    if (error) {
      console.log(error);
      return;
    }

    setBookmarks((prev) =>
      prev.filter(
        (b) =>
          b.productId !==
          productId
      )
    );
  }

  // CHECK
  function isBookmarked(
    productId: string
  ) {
    return bookmarks.some(
      (b) =>
        b.productId === productId
    );
  }

  // TOGGLE
  async function toggleBookmark(
    productId: string
  ) {
    if (isBookmarked(productId)) {
      await removeBookmark(
        productId
      );
    } else {
      await addBookmark(
        productId
      );
    }
  }

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        addBookmark,
        removeBookmark,
        isBookmarked,
        toggleBookmark,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context =
    useContext(BookmarkContext);

  if (!context) {
    throw new Error(
      "useBookmarks must be used within BookmarkProvider"
    );
  }

  return context;
}