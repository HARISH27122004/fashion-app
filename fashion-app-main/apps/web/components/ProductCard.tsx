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

export default function ProductCard({ product }: ProductCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { addToCart, getQuantity } = useCart();
  const bookmarked = isBookmarked(product.id);
  const quantity = getQuantity(product.id);

  return (
    <div
      className={styles.card}
      id={`product-card-${product.id}`}
    >
      <Link href={`/product/${product.id}`} className={styles.imageWrap}>
        <Image
          src={product.image}
          alt={product.name}
          width={400}
          height={400}
          className={styles.image}
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </Link>

      <div className={styles.info}>
        <div className={styles.nameRow}>
          <Link href={`/product/${product.id}`} className={styles.name}>
            {product.name}
          </Link>
          <span className={styles.stock}>In Stock</span>
        </div>

        <div className={styles.priceRow}>
          <span className={styles.price}>
            ${product.price.toFixed(2)}
          </span>
          <div className={styles.actions}>
            <button
              className={`${styles.addBtn} ${styles.cartBtn}`}
              aria-label={quantity > 0 ? `Add more ${product.name} to cart (${quantity} in cart)` : `Add ${product.name} to cart`}
              id={`add-to-cart-${product.id}`}
              onClick={(e) => {
                e.preventDefault();
                addToCart(product.id);
              }}
            >
              {quantity > 0 ? (
                <span className={styles.quantityBadge}>{quantity}</span>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </button>
            <button
              className={`${styles.bookmarkBtn} ${bookmarked ? styles.bookmarked : ""}`}
              aria-label={bookmarked ? `Remove ${product.name} from bookmarks` : `Save ${product.name} to bookmarks`}
              id={`bookmark-${product.id}`}
              onClick={(e) => {
                e.preventDefault();
                toggleBookmark(product.id);
              }}
            >
              <svg
                width="18"
                height="18"
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
    </div>
  );
}
