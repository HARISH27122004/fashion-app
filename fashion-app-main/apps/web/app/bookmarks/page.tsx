"use client";

import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { getProductById } from "@/data/products";
import styles from "./page.module.css";

export default function BookmarksPage() {
  const { bookmarks } = useBookmarks();

  const bookmarkedProducts = bookmarks
    .map((b) => getProductById(b.productId))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    .sort((a, b) => {
      // Sort by most recently bookmarked
      const aTime = bookmarks.find((bm) => bm.productId === a.id)?.timestamp || 0;
      const bTime = bookmarks.find((bm) => bm.productId === b.id)?.timestamp || 0;
      return bTime - aTime;
    });

  return (
    <>
      <Header showBack title="Bookmarks" showBookmark />

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
            <h2>No bookmarks yet</h2>
            <p>Items you save will appear here</p>
          </div>
        )}
      </main>
    </>
  );
}
