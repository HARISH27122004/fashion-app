"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useCheckout } from "@/contexts/CheckoutContext";
import { useSearch } from "@/contexts/SearchContext"; // ✅ added
import { getProductById } from "@/data/products";
import styles from "./page.module.css";

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { setStep } = useCheckout();
  const { searchQuery } = useSearch(); // ✅ added

  const cartItems = cart
    .map((item) => {
      const product = getProductById(item.productId);
      return product ? { ...item, product } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    // ✅ search filter added
    .filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.product.name?.toLowerCase().includes(q) ||
        item.product.category?.toLowerCase().includes(q) ||
        String(item.product.price).includes(q)
      );
    });

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  function handleCheckout() {
    setStep("address");
    router.push("/cart/address");
  }

  return (
    <>
      <main className={styles.main}>
        {cartItems.length > 0 ? (
          <>
            <div className={styles.cartHeader}>
              <span className={styles.itemCount}>
                {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
              </span>

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
                    <p className={styles.productPrice}>
                      ${product.price.toFixed(2)}
                    </p>
                  </div>

                  <div className={styles.quantityControl}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(productId, quantity - 1)}
                    >
                      –
                    </button>
                    <span className={styles.quantity}>{quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(productId, quantity + 1)}
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
                  >
                    🗑
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

              <button className={styles.checkoutBtn} onClick={handleCheckout}>
                Continue to Address
              </button>
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            {/* ✅ search-aware empty state */}
            <h2>{searchQuery ? `No results for "${searchQuery}"` : "Your cart is empty"}</h2>
            <p>{searchQuery ? "Try a different search term" : "Looks like you haven't added anything yet"}</p>
          </div>
        )}
      </main>
    </>
  );
}