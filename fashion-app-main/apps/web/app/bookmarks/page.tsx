"use client";

import ProductCard from "@/components/ProductCard";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { getProductById } from "@/data/products";
import { useSearch } from "@/contexts/SearchContext"; // ✅ added
import styles from "./page.module.css";

export default function BookmarksPage() {
  const { bookmarks } = useBookmarks();
  const { searchQuery } = useSearch(); // ✅ added

  const bookmarkedProducts = bookmarks
    .map((b) => getProductById(b.productId))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    // ✅ search filter added
    .filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        String(p.price).includes(q)
      );
    });

  return (
    <>
      <main className={styles.main}>
        {bookmarkedProducts.length > 0 ? (
          <section className={styles.productGrid} id="bookmarks-grid">
            {bookmarkedProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </section>
        ) : (
          <div className={styles.empty}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            {/* ✅ search-aware empty state */}
            <h2>{searchQuery ? `No results for "${searchQuery}"` : "No bookmarks yet"}</h2>
            <p>{searchQuery ? "Try a different search term" : "Items you save will appear here"}</p>
          </div>
        )}
      </main>
    </>
  );
}