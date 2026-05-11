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

  // ───────────────────────────────────
  // LOAD BOOKMARKS
  // ───────────────────────────────────
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
          // SIGNED OUT
          if (
            event === "SIGNED_OUT"
          ) {
            await loadBookmarks();
          }

          // SIGNED IN
          if (event === "SIGNED_IN") {
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (user) {
              // ───────────────────────────────
              // MERGE GUEST BOOKMARKS
              // ───────────────────────────────
              const guestBookmarks =
                localStorage.getItem(
                  "guest-bookmarks"
                );

              if (guestBookmarks) {
                const parsedBookmarks =
                  JSON.parse(
                    guestBookmarks
                  );

                // EXISTING USER BOOKMARKS
                const {
                  data: existingBookmarks,
                } = await supabase
                  .from("bookmarks")
                  .select("product_id")
                  .eq("user_id", user.id);

                const existingIds =
                  new Set(
                    existingBookmarks?.map(
                      (item) =>
                        item.product_id
                    ) || []
                  );

                // FILTER NEW
                const bookmarksToInsert =
                  parsedBookmarks
                    .filter(
                      (
                        item: Bookmark
                      ) =>
                        !existingIds.has(
                          item.productId
                        )
                    )
                    .map(
                      (
                        item: Bookmark
                      ) => ({
                        user_id: user.id,

                        product_id:
                          item.productId,
                      })
                    );

                // INSERT
                if (
                  bookmarksToInsert.length >
                  0
                ) {
                  await supabase
                    .from(
                      "bookmarks"
                    )
                    .insert(
                      bookmarksToInsert
                    );
                }

                // CLEAR GUEST STORAGE
                localStorage.removeItem(
                  "guest-bookmarks"
                );
              }
            }

            // LOAD FINAL BOOKMARKS
            await loadBookmarks();
          }
        }
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  // ───────────────────────────────────
  // LOAD BOOKMARKS
  // ───────────────────────────────────
  async function loadBookmarks() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ── GUEST USER ───────────────────
    if (!user) {
      const guestBookmarks =
        localStorage.getItem(
          "guest-bookmarks"
        );

      if (guestBookmarks) {
        setBookmarks(
          JSON.parse(
            guestBookmarks
          )
        );
      } else {
        setBookmarks([]);
      }

      return;
    }

    // ── LOGGED USER ──────────────────
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

  // ───────────────────────────────────
  // ADD BOOKMARK
  // ───────────────────────────────────
  async function addBookmark(
    productId: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ── GUEST USER ───────────────────
    if (!user) {
      const exists =
        bookmarks.some(
          (b) =>
            b.productId ===
            productId
        );

      if (exists) return;

      const updatedBookmarks =
        [
          ...bookmarks,
          { productId },
        ];

      setBookmarks(
        updatedBookmarks
      );

      localStorage.setItem(
        "guest-bookmarks",
        JSON.stringify(
          updatedBookmarks
        )
      );

      return;
    }

    // ── LOGGED USER ──────────────────
    const { error } =
      await supabase
        .from("bookmarks")
        .insert([
          {
            user_id: user.id,

            product_id:
              productId,
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

  // ───────────────────────────────────
  // REMOVE BOOKMARK
  // ───────────────────────────────────
  async function removeBookmark(
    productId: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ── GUEST USER ───────────────────
    if (!user) {
      const updatedBookmarks =
        bookmarks.filter(
          (b) =>
            b.productId !==
            productId
        );

      setBookmarks(
        updatedBookmarks
      );

      localStorage.setItem(
        "guest-bookmarks",
        JSON.stringify(
          updatedBookmarks
        )
      );

      return;
    }

    // ── LOGGED USER ──────────────────
    const { error } =
      await supabase
        .from("bookmarks")
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

    setBookmarks((prev) =>
      prev.filter(
        (b) =>
          b.productId !==
          productId
      )
    );
  }

  // ───────────────────────────────────
  // CHECK BOOKMARK
  // ───────────────────────────────────
  function isBookmarked(
    productId: string
  ) {
    return bookmarks.some(
      (b) =>
        b.productId ===
        productId
    );
  }

  // ───────────────────────────────────
  // TOGGLE BOOKMARK
  // ───────────────────────────────────
  async function toggleBookmark(
    productId: string
  ) {
    if (
      isBookmarked(productId)
    ) {
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
    useContext(
      BookmarkContext
    );

  if (!context) {
    throw new Error(
      "useBookmarks must be used within BookmarkProvider"
    );
  }

  return context;
}