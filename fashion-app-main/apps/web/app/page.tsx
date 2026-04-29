"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";
import { categories } from "@/data/products";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase.from("products").select("*");

    if (error) {
      console.log(error);
      return;
    }

    if (data) {
      setProducts(
        data.map((item) => ({
          ...item,
          id: String(item.id),
        }))
      );
    }
  }

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter(
          (product) => product.category === selectedCategory
        );

  return (
    <>
      <Header />

      <main className={styles.main}>
        <section className={styles.hero} id="hero-section">
          <h2 className={styles.heroTitle}>
            Discover
            <br />
            Latest Fashion
          </h2>
        </section>

        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <section className={styles.productGrid} id="product-grid">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}

          {filteredProducts.length === 0 && (
            <div className={styles.empty}>
              <p>No products found in this category.</p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </>
  );
}