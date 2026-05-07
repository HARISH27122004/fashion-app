"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";

import { categories } from "@/data/products";

import { supabase } from "@/lib/supabase";

import Loader from "@/components/Loader";

import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [products, setProducts] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  // SORT
  const [sortBy, setSortBy] =
    useState("default");

  // PRICE FILTER
  const [maxPrice, setMaxPrice] =
    useState(10000);

  // CHECK USER
  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // NOT LOGGED IN
    if (!user) {
      router.push("/login");
      return;
    }

    // LOGGED IN
    fetchProducts();
  }

  async function fetchProducts() {
    const { data, error } =
      await supabase
        .from("products")
        .select("*");

    if (error) {
      console.log(error);

      setLoading(false);

      return;
    }

    if (data) {
      const formattedProducts =
        data.map((item) => ({
          ...item,

          id: String(item.id),

          price:
            Number(item.price) || 0,

          category:
            item.category || "all",
        }));

      setProducts(
        formattedProducts
      );
    }

    setLoading(false);
  }

  // FILTERED PRODUCTS
  const filteredProducts = [
    ...(selectedCategory ===
      "all"
      ? products
      : products.filter(
        (product) =>
          product.category ===
          selectedCategory
      )),
  ]
    // PRICE FILTER
    .filter(
      (product) =>
        Number(product.price) <=
        maxPrice
    )

    // SORTING
    .sort((a, b) => {
      if (
        sortBy === "low-high"
      ) {
        return (
          Number(a.price) -
          Number(b.price)
        );
      }

      if (
        sortBy ===
        "high-low"
      ) {
        return (
          Number(b.price) -
          Number(a.price)
        );
      }

      if (
        sortBy === "newest"
      ) {
        return (
          Number(b.id) -
          Number(a.id)
        );
      }

      return 0;
    });

  // LOADING SCREEN
  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Header />

      <main className={styles.main}>
        {/* HERO */}
        <section
          className={styles.hero}
          id="hero-section"
        >
          <h2
            className={
              styles.heroTitle
            }
          >
            Discover
            <br />
            Latest Fashion
          </h2>
        </section>

        {/* FILTERS */}
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
              onChange={(e) =>
                setSortBy(
                  e.target.value
                )
              }
              className={styles.select}
            >
              <option value="default" disabled>
                Sort By
              </option>

              <option value="low-high">
                Price: Low to High
              </option>

              <option value="high-low">
                Price: High to Low
              </option>

              <option value="newest">
                Newest
              </option>
            </select>

            {/* PRICE */}
            <select
              value={maxPrice}
              onChange={(e) =>
                setMaxPrice(
                  Number(
                    e.target.value
                  )
                )
              }
              className={styles.select}
            >
              <option value="10000" disabled>
                All Prices
              </option>

              <option value="500">
                Under ₹500
              </option>

              <option value="1000">
                Under ₹1000
              </option>

              <option value="2000">
                Under ₹2000
              </option>

              <option value="5000">
                Under ₹5000
              </option>
            </select>
          </div>
        </div>

        {/* PRODUCTS */}
        <section
          className={
            styles.productGrid
          }
          id="product-grid"
        >
          {filteredProducts.map(
            (product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
              />
            )
          )}

          {filteredProducts.length ===
            0 && (
              <div
                className={
                  styles.empty
                }
              >
                <p>
                  No products found.
                </p>
              </div>
            )}
        </section>
      </main>

      <BottomNav />
    </>
  );
}