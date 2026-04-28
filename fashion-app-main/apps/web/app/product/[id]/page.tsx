"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import { getProductById } from "@/data/products";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { useCart } from "@/contexts/CartContext";
import styles from "./page.module.css";

export default function ProductDetail() {
  const params = useParams();
  const product = getProductById(params.id as string);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { addToCart, getQuantity } = useCart();

  if (!product) {
    return (
      <>
        <Header showBack title="Details" showBookmark />
        <div className={styles.notFound}>
          <p>Product not found</p>
        </div>
      </>
    );
  }

  const bookmarked = isBookmarked(product.id);
  const quantity = getQuantity(product.id);

  return (
    <>
      <Header showBack title="Details" showBookmark />

      <main className={styles.main}>
        <div className={styles.imageContainer} id="product-image">
          <Image
            src={product.image}
            alt={product.name}
            width={600}
            height={700}
            className={styles.image}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className={styles.content}>
          <div className={styles.titleRow}>
            <h2 className={styles.productName}>{product.name}</h2>
            <span className={styles.stockBadge}>In Stock</span>
          </div>

          <div className={styles.sizesSection}>
            <h3 className={styles.sectionLabel}>Sizes</h3>
            <div className={styles.sizeGrid} id="size-selector">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={`${styles.sizeBtn} ${selectedSize === size ? styles.sizeActive : ""}`}
                  onClick={() => setSelectedSize(size)}
                  id={`size-${size.toLowerCase()}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.descriptionSection}>
            <h3 className={styles.sectionLabel}>Description</h3>
            <p className={styles.description}>{product.description}</p>
          </div>
        </div>
      </main>

      <div className={styles.bottomBar} id="product-bottom-bar">
        <div className={styles.bottomActions}>
          <button className={styles.buyNowWrap} id="buy-now-wrap">
            <span className={styles.buyNowText}>Buy Now</span>
            <span className={styles.tryNowTag}>Try now</span>
          </button>
        </div>
        <div className={styles.bottomRight}>
          <span className={styles.bottomPrice}>
            ${product.price.toFixed(2)}
          </span>
          <div className={styles.bottomActions}>
            <button
              className={`${styles.cartBtn}`}
              aria-label={quantity > 0 ? `Add more ${product.name} to cart (${quantity} in cart)` : `Add ${product.name} to cart`}
              id="add-to-cart-detail"
              onClick={() => addToCart(product.id)}
            >
              {quantity > 0 ? (
                <span className={styles.quantityBadge}>{quantity}</span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </button>
            <button
              className={`${styles.bookmarkBtn} ${bookmarked ? styles.bookmarked : ""}`}
              aria-label={bookmarked ? `Remove ${product.name} from bookmarks` : `Save ${product.name} to bookmarks`}
              id="bookmark-detail"
              onClick={() => toggleBookmark(product.id)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={bookmarked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
