"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";
import ToastNotification, { ToastItem } from "@/components/ToastNotification";
import { useNotifications } from "@/hooks/useNotifications";
import { categories } from "@/data/products";
import { supabase } from "@/lib/supabase";
import Loader from "@/components/Loader";
import { useSearch } from "@/contexts/SearchContext";
import styles from "./page.module.css";

// ── Toast dismissed-IDs helpers ──────────────────────────
const DISMISSED_KEY = "toast_dismissed_ids";

function getDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markDismissed(id: string) {
  if (typeof window === "undefined") return;
  const ids = getDismissedIds();
  ids.add(id);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
}

export default function Home() {
  const router = useRouter();
  const { searchQuery } = useSearch();

  // ── Products / UI state ──────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("default");
  const [maxPrice, setMaxPrice] = useState(10000);

  // ── Toast / notification state ───────────────────────
  const [activeToasts, setActiveToasts] = useState<ToastItem[]>([]);
  const hasInitialized = useRef(false);
  const notifications = useNotifications();

  // ── Auth check ───────────────────────────────────────
  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    fetchProducts();
  }

  // ── Fetch products ───────────────────────────────────
  async function fetchProducts() {
    const { data, error } = await supabase.from("products").select("*");

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    if (data) {
      const formattedProducts = data.map((item) => ({
        ...item,
        id: String(item.id),
        price: Number(item.price) || 0,
        category: item.category || "all",
      }));

      setProducts(formattedProducts);
    }

    setLoading(false);
  }

  // ── Toast / notification logic ───────────────────────
  useEffect(() => {
    if (notifications.length === 0) return;

    if (!hasInitialized.current) {
      hasInitialized.current = true;

      const dismissed = getDismissedIds();
      const toShow = notifications.filter((n) => !dismissed.has(n.id));

      if (toShow.length > 0) {
        setActiveToasts(toShow.map((n) => ({ id: n.id, message: n.message })));
      }
      return;
    }

    // After init: only add brand-new notifications (not already shown or dismissed)
    setActiveToasts((prev) => {
      const dismissed = getDismissedIds();
      const existingIds = new Set(prev.map((t) => t.id));

      const brandNew = notifications
        .filter((n) => !dismissed.has(n.id) && !existingIds.has(n.id))
        .map((n) => ({ id: n.id, message: n.message }));

      return brandNew.length > 0 ? [...brandNew, ...prev] : prev;
    });
  }, [notifications]);

  function handleDismiss(id: string) {
    markDismissed(id);
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Filtering & sorting ──────────────────────────────
  const filteredProducts = [
    ...(selectedCategory === "all"
      ? products
      : products.filter((product) => product.category === selectedCategory)),
  ]
    .filter((product) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        product.name?.toLowerCase().includes(q) ||
        product.category?.toLowerCase().includes(q) ||
        String(product.price).includes(q)
      );
    })
    .filter((product) => Number(product.price) <= maxPrice)
    .sort((a, b) => {
      if (sortBy === "low-high") return Number(a.price) - Number(b.price);
      if (sortBy === "high-low") return Number(b.price) - Number(a.price);
      if (sortBy === "newest") return Number(b.id) - Number(a.id);
      return 0;
    });

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <main className={styles.main}>
        {/* TOAST NOTIFICATIONS */}
        <ToastNotification toasts={activeToasts} onDismiss={handleDismiss} />

        {/* HERO */}
        <section className={styles.hero} id="hero-section">
          <h2 className={styles.heroTitle}>
            Discover
            <br />
            Latest Fashion
          </h2>
        </section>

        {/* FILTER ROW */}
        <div className={styles.filterRow}>
          {/* LEFT */}
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {/* RIGHT */}
          <div className={styles.sortFilters}>
            {/* SORT */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.select}
            >
              <option value="default" disabled>Sort By</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>

            {/* PRICE */}
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className={styles.select}
            >
              <option value="10000" disabled>All Prices</option>
              <option value="500">Under ₹500</option>
              <option value="1000">Under ₹1000</option>
              <option value="2000">Under ₹2000</option>
              <option value="5000">Under ₹5000</option>
            </select>
          </div>
        </div>

        {/* PRODUCTS */}
        <section className={styles.productGrid} id="product-grid">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}

          {filteredProducts.length === 0 && (
            <div className={styles.empty}>
              <p>
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "No products found."}
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}