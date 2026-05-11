"use client";

import Image from "next/image";
import Link from "next/link";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/data/products";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  // ✅ pull in decrementFromCart alongside the others
  const { addToCart, removeFromCart, decrementFromCart, getQuantity } = useCart();
  const bookmarked = isBookmarked(product.id);
  const quantity = getQuantity(product.id);

  const hasDiscount =
    typeof product.discount_percent === "number" &&
    product.discount_percent > 0 &&
    product.original_price != null;

  return (
    <article
      className={styles.card}
      id={`product-card-${product.id}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image */}
      <Link href={`/product/${product.id}`} className={styles.imageWrap}>
        {hasDiscount && (
          <div className={styles.discountBadge}>
            -{product.discount_percent}%
          </div>
        )}
        <Image
          src={product.image}
          alt={product.name}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </Link>

      {/* Info */}
      <div className={styles.info}>
        <Link href={`/product/${product.id}`} className={styles.name}>
          {product.name}
        </Link>

        <div className={styles.bottomRow}>
          <div className={styles.priceWrap}>
            <span
              className={`${styles.originalPrice}${hasDiscount ? "" : ` ${styles.noDiscount}`}`}
            >
              {hasDiscount ? `$${product.original_price!.toFixed(2)}` : "\u00A0"}
            </span>
            <span className={styles.pricePill}>
              ${product.price.toFixed(2)}
            </span>
          </div>

          <div className={styles.controls}>
            {quantity === 0 ? (
              /* Add button — shown when item not in cart */
              <button
                className={styles.iconBtn}
                aria-label={`Add ${product.name} to cart`}
                onClick={() => addToCart(product.id)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            ) : (
              /* Qty pill — shown when item is in cart */
              <div className={styles.qtyPill}>
                {/* ✅ FIXED: decrementFromCart instead of removeFromCart */}
                <button
                  className={styles.qBtn}
                  aria-label="Remove one"
                  onClick={() => decrementFromCart(product.id)}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <span className={styles.qNum}>{quantity}</span>
                <button
                  className={styles.qBtn}
                  aria-label="Add one more"
                  onClick={() => addToCart(product.id)}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Bookmark */}
            <button
              className={`${styles.iconBtn}${bookmarked ? ` ${styles.bookmarked}` : ""}`}
              aria-label={bookmarked ? `Unbookmark ${product.name}` : `Bookmark ${product.name}`}
              onClick={() => toggleBookmark(product.id)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24"
                fill={bookmarked ? "currentColor" : "none"}
                stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}