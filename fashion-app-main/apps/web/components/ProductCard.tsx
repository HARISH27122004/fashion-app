import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
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
          <button
            className={styles.addBtn}
            aria-label={`Add ${product.name} to cart`}
            id={`add-to-cart-${product.id}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
