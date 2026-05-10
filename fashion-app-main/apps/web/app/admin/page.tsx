"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addNotification,
  useNotifications,
  clearAllNotifications,
  removeNotification,
} from "@/hooks/useNotifications";
import { supabase } from "@/lib/supabase";
import styles from "./admin.module.css";

const DISCOUNT_OPTIONS = [10, 20, 30, 50, 70];

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  image: string;
  category: string;
}

export default function AdminPage() {
  const router = useRouter();

  // ── Auth / shared state ──────────────────────────────
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "offers">("orders");

  // ── Orders state ─────────────────────────────────────
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<any>({});

  // ── Offers / Notifications state ──────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customMessage, setCustomMessage] = useState("");
  const [offerLoading, setOfferLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const notifications = useNotifications();

  // ── Auth check (runs once) ────────────────────────────
  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/admin/login");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (data?.role !== "admin") {
      router.push("/login");
      return;
    }

    // Both sections need data up front
    await Promise.all([fetchOrders(), fetchProducts()]);
    setAuthLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  // ── Orders logic ──────────────────────────────────────
  async function fetchOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: false });

    if (data) setOrders(data);
    setOrdersLoading(false);
  }

  async function fetchOrderItems(orderId: number) {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }

    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    setOrderItems((prev: any) => ({ ...prev, [orderId]: data || [] }));
    setExpandedOrder(orderId);
  }

  async function updateStatus(id: number, status: string) {
    await supabase
      .from("orders")
      .update({ orders_status: status })
      .eq("id", id);
    fetchOrders();
  }

  // ── Offers / Notifications logic ──────────────────────
  async function fetchProducts() {
    const { data, error } = await supabase.from("products").select("*");
    if (error) { console.error(error); return; }
    if (data) setProducts(data.map((p) => ({ ...p, id: String(p.id) })));
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const discountedPrice =
    selectedProduct && discountPercent > 0
      ? (selectedProduct.price * (1 - discountPercent / 100)).toFixed(2)
      : null;

  const autoMessage =
    selectedProduct && discountPercent > 0
      ? `${discountPercent}% OFF on ${selectedProduct.name}! Now $${discountedPrice}`
      : "";

  const finalMessage = customMessage.trim() || autoMessage;

  async function handleSendOffer() {
    if (!selectedProduct || discountPercent === 0) return;
    setOfferLoading(true);

    try {
      const originalPrice = selectedProduct.original_price ?? selectedProduct.price;
      const newPrice = parseFloat(
        (originalPrice * (1 - discountPercent / 100)).toFixed(2)
      );

      const { error } = await supabase
        .from("products")
        .update({
          price: newPrice,
          original_price: originalPrice,
          discount_percent: discountPercent,
        })
        .eq("id", selectedProduct.id);

      if (error) { console.error(error); setOfferLoading(false); return; }

      addNotification(finalMessage, selectedProduct.id);
      await fetchProducts();

      setSent(true);
      setTimeout(() => setSent(false), 2500);
      setSelectedProductId("");
      setDiscountPercent(0);
      setCustomMessage("");
    } catch (e) {
      console.error(e);
    }
    setOfferLoading(false);
  }

  async function handleRemoveDiscount(product: Product) {
    if (!product.original_price) return;
    setRemovingId(product.id);

    await supabase
      .from("products")
      .update({ price: product.original_price, original_price: null, discount_percent: 0 })
      .eq("id", product.id);

    await fetchProducts();
    setRemovingId(null);
  }

  const discountedProducts = products.filter(
    (p) => p.discount_percent && p.discount_percent > 0
  );

  // ── Loading screen ────────────────────────────────────
  if (authLoading) {
    return (
      <main style={{ padding: "24px" }}>
        <h2>Checking access...</h2>
      </main>
    );
  }

  // ── Render ────────────────────────────────────────────
  return (
    <main
      style={{
        padding: "24px",
        background: "#f7f7f7",
        minHeight: "100vh",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>Admin Dashboard</h1>
          <p style={{ color: "#666" }}>Manage orders, discounts, and notifications</p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "12px 18px",
            borderRadius: "14px",
            border: "none",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Logout
        </button>
      </div>

      {/* ── Tab Bar ── */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "28px",
          background: "#fff",
          padding: "6px",
          borderRadius: "18px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          width: "fit-content",
        }}
      >
        {(["orders", "offers"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 28px",
              borderRadius: "13px",
              border: "none",
              background: activeTab === tab ? "#111" : "transparent",
              color: activeTab === tab ? "#fff" : "#555",
              fontWeight: 600,
              fontSize: "15px",
              cursor: "pointer",
              transition: "all 0.2s",
              textTransform: "capitalize",
            }}
          >
            {tab === "orders" ? "📦 Orders" : "🏷️ Offers & Notifications"}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB: ORDERS
      ══════════════════════════════════════════════════ */}
      {activeTab === "orders" && (
        <div style={{ display: "grid", gap: "22px" }}>
          {ordersLoading ? (
            <p>Loading orders…</p>
          ) : orders.length === 0 ? (
            <p style={{ color: "#888" }}>No orders yet.</p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: "#fff",
                  borderRadius: "24px",
                  padding: "24px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  border: "1px solid #eee",
                }}
              >
                {/* TOP */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>
                      Order #{order.id}
                    </h2>
                    <div style={{ display: "grid", gap: "8px", color: "#444" }}>
                      <p><strong>Customer:</strong> {order.customer_name}</p>
                      <p><strong>Phone:</strong> {order.phone}</p>
                      <p><strong>Address:</strong> {order.address}</p>
                      <p><strong>Total:</strong> ₹{order.total_amount}</p>
                      <p>
                        <strong>Payment:</strong> {order.payment_method} ({order.payment_status})
                      </p>
                    </div>
                  </div>

                  {/* STATUS */}
                  <div style={{ minWidth: "220px" }}>
                    <div
                      style={{
                        marginBottom: "12px",
                        padding: "10px 16px",
                        borderRadius: "999px",
                        display: "inline-block",
                        background:
                          order.orders_status === "Delivered"
                            ? "#dcfce7"
                            : order.orders_status === "Cancelled"
                            ? "#fee2e2"
                            : "#fef3c7",
                        color:
                          order.orders_status === "Delivered"
                            ? "#166534"
                            : order.orders_status === "Cancelled"
                            ? "#991b1b"
                            : "#92400e",
                        fontWeight: 700,
                      }}
                    >
                      {order.orders_status}
                    </div>

                    <select
                      value={order.orders_status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "14px",
                        border: "1px solid #ddd",
                        background: "#fff",
                        fontSize: "15px",
                      }}
                    >
                      <option>Pending</option>
                      <option>Packed</option>
                      <option>Shipped</option>
                      <option>Delivered</option>
                      <option>Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* VIEW ITEMS */}
                <button
                  onClick={() => fetchOrderItems(order.id)}
                  style={{
                    marginTop: "22px",
                    padding: "12px 18px",
                    borderRadius: "14px",
                    border: "none",
                    background: "#111",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {expandedOrder === order.id ? "Hide Items" : "View Ordered Items"}
                </button>

                {/* ORDER ITEMS */}
                {expandedOrder === order.id && (
                  <div style={{ marginTop: "24px", display: "grid", gap: "16px" }}>
                    {orderItems[order.id]?.map((item: any) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          gap: "16px",
                          alignItems: "center",
                          border: "1px solid #eee",
                          borderRadius: "18px",
                          padding: "16px",
                        }}
                      >
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          style={{
                            width: "90px",
                            height: "90px",
                            objectFit: "cover",
                            borderRadius: "14px",
                          }}
                        />
                        <div>
                          <h3 style={{ marginBottom: "8px" }}>{item.product_name}</h3>
                          <p>Quantity: {item.quantity}</p>
                          <p>Price: ₹{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: OFFERS & NOTIFICATIONS
      ══════════════════════════════════════════════════ */}
      {activeTab === "offers" && (
        <>
          {/* ── Offer composer ── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.badge}>ADMIN</span>
              <h1 className={styles.title}>Send Product Offer</h1>
              <p className={styles.subtitle}>
                Select a product, set a discount, and send a notification. The price
                updates in Supabase and a toast appears on the landing page.
              </p>
            </div>

            {/* Step 1: Pick product */}
            <div className={styles.section}>
              <label className={styles.label}>1. Select Product</label>
              <div className={styles.productGrid}>
                {products.map((p) => (
                  <button
                    key={p.id}
                    className={`${styles.productChip} ${
                      selectedProductId === p.id ? styles.productChipActive : ""
                    } ${p.discount_percent ? styles.productChipDiscounted : ""}`}
                    onClick={() => setSelectedProductId(p.id)}
                  >
                    <span className={styles.chipName}>{p.name}</span>
                    <span className={styles.chipPrice}>
                      {p.discount_percent ? (
                        <>
                          <s>${p.original_price?.toFixed(2)}</s>{" "}
                          <strong>${p.price.toFixed(2)}</strong>
                        </>
                      ) : (
                        `$${p.price.toFixed(2)}`
                      )}
                    </span>
                    {p.discount_percent ? (
                      <span className={styles.discountTag}>{p.discount_percent}% OFF</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Discount */}
            {selectedProductId && (
              <div className={styles.section}>
                <label className={styles.label}>2. Select Discount</label>
                <div className={styles.discountGrid}>
                  {DISCOUNT_OPTIONS.map((d) => (
                    <button
                      key={d}
                      className={`${styles.discountChip} ${
                        discountPercent === d ? styles.discountChipActive : ""
                      }`}
                      onClick={() => setDiscountPercent(d)}
                    >
                      {d}%
                    </button>
                  ))}
                </div>

                {discountPercent > 0 && selectedProduct && (
                  <div className={styles.preview}>
                    <span className={styles.previewLabel}>Price after discount:</span>
                    <span className={styles.previewOld}>
                      ${(selectedProduct.original_price ?? selectedProduct.price).toFixed(2)}
                    </span>
                    <span className={styles.previewArrow}>→</span>
                    <span className={styles.previewNew}>${discountedPrice}</span>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Message */}
            {selectedProductId && discountPercent > 0 && (
              <div className={styles.section}>
                <label className={styles.label}>
                  3. Notification Message
                  <span className={styles.labelNote}>(optional — auto-generated if blank)</span>
                </label>
                <textarea
                  className={styles.textarea}
                  placeholder={autoMessage}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={2}
                  maxLength={200}
                />
                <div className={styles.composerFooter}>
                  <span className={styles.charCount}>
                    Preview: {finalMessage || autoMessage}
                  </span>
                </div>
              </div>
            )}

            {/* Send button */}
            <button
              className={`${styles.sendBtn} ${sent ? styles.sentBtn : ""}`}
              onClick={handleSendOffer}
              disabled={!selectedProductId || discountPercent === 0 || offerLoading || sent}
            >
              {sent ? "✓ Offer Sent!" : offerLoading ? "Sending..." : "Send Offer Notification"}
            </button>
          </div>

          {/* ── Active discounts ── */}
          {discountedProducts.length > 0 && (
            <div className={styles.card}>
              <div className={styles.listHeader}>
                <h2 className={styles.listTitle}>
                  Active Discounts
                  <span className={styles.count}>{discountedProducts.length}</span>
                </h2>
              </div>
              <ul className={styles.list}>
                {discountedProducts.map((p) => (
                  <li key={p.id} className={styles.item}>
                    <div className={styles.itemContent}>
                      <p className={styles.itemMessage}>{p.name}</p>
                      <p className={styles.itemSub}>
                        <s>${p.original_price?.toFixed(2)}</s>
                        {" → "}
                        <strong>${p.price.toFixed(2)}</strong>{" "}
                        <span className={styles.discountBadge}>{p.discount_percent}% OFF</span>
                      </p>
                    </div>
                    <button
                      className={styles.restoreBtn}
                      onClick={() => handleRemoveDiscount(p)}
                      disabled={removingId === p.id}
                    >
                      {removingId === p.id ? "..." : "Remove"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Sent notifications ── */}
          <div className={styles.card}>
            <div className={styles.listHeader}>
              <h2 className={styles.listTitle}>
                Sent Notifications
                <span className={styles.count}>{notifications.length}</span>
              </h2>
              {notifications.length > 0 && (
                <button className={styles.clearBtn} onClick={clearAllNotifications}>
                  Clear all
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🔔</span>
                <p>No notifications sent yet.</p>
              </div>
            ) : (
              <ul className={styles.list}>
                {notifications.map((n) => (
                  <li key={n.id} className={styles.item}>
                    <div className={styles.itemContent}>
                      <p className={styles.itemMessage}>{n.message}</p>
                      <time className={styles.itemTime}>
                        {new Date(n.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => removeNotification(n.id)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </main>
  );
}