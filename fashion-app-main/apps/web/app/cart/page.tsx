"use client";

import Header from "@/components/Header";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { useCheckout } from "@/contexts/CheckoutContext";
import { getProductById } from "@/data/products";
import styles from "./page.module.css";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { setStep } = useCheckout();

  const cartItems = cart
    .map((item) => {
      const product = getProductById(item.productId);
      return product ? { ...item, product } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <>
      <Header showBack title="Cart" />

      <main className={styles.main}>
        {cartItems.length > 0 ? (
          <>
            <div className={styles.cartHeader}>
              <span className={styles.itemCount}>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
              <button className={styles.clearBtn} onClick={clearCart}>
                Clear all
              </button>
            </div>

            <div className={styles.cartList}>
              {cartItems.map(({ productId, quantity, product }) => (
                <div key={productId} className={styles.cartItem}>
            <div className={styles.productImageWrap}>
              <Image
                src={product.image}
                alt={product.name}
                className={styles.productImage}
                width={80}
                height={80}
                sizes="80px"
              />
            </div>
                  <div className={styles.productDetails}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productPrice}>${product.price.toFixed(2)}</p>
                  </div>
                  <div className={styles.quantityControl}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(productId, quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      –
                    </button>
                    <span className={styles.quantity}>{quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(productId, quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <div className={styles.itemTotal}>
                    ${(product.price * quantity).toFixed(2)}
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFromCart(productId)}
                    aria-label={`Remove ${product.name} from cart`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3,6 5,6 21,6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
               <button className={styles.checkoutBtn} onClick={() => setStep('address')}>
                 Continue to Address
               </button>
            </div>
          </>
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
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven&apos;t added anything yet</p>
          </div>
        )}
      </main>
    </>
  );
}
