"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";


import { supabase } from "@/lib/supabase";

export default function OrderDetailsPage() {
  const params = useParams();

  const orderId = params.id;

  const [order, setOrder] =
    useState<any>(null);

  const [items, setItems] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  async function fetchOrderDetails() {
    // FETCH ORDER
    const { data: orderData } =
      await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

    // FETCH ITEMS
    const { data: itemsData } =
      await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

    if (orderData) {
      setOrder(orderData);
    }

    if (itemsData) {
      setItems(itemsData);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main
        style={{
          padding: "24px",
        }}
      >
        <h2>Loading Order...</h2>
      </main>
    );
  }

  if (!order) {
    return (
      <main
        style={{
          padding: "24px",
        }}
      >
        <h2>Order Not Found</h2>
      </main>
    );
  }

  return (
    <>
      <main
        style={{
          padding: "24px",
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        {/* ORDER INFO */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: "18px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <h2>
            Order Summary
          </h2>

          <p>
            <strong>Status:</strong>{" "}
            {order.orders_status}
          </p>

          <p>
            <strong>Payment:</strong>{" "}
            {order.payment_status}
          </p>

          <p>
            <strong>Total:</strong> ₹
            {order.total_amount}
          </p>

          <p>
            <strong>Address:</strong>{" "}
            {order.address}
          </p>
        </div>

        {/* ORDER ITEMS */}
        <div
          style={{
            display: "grid",
            gap: "16px",
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                gap: "16px",
                padding: "16px",
                border: "1px solid #eee",
                borderRadius: "18px",
                background: "#fff",
              }}
            >
              <img
                src={item.product_image}
                alt={item.product_name}
                style={{
                  width: "90px",
                  height: "90px",
                  objectFit: "cover",
                  borderRadius: "12px",
                }}
              />

              <div>
                <h3>
                  {item.product_name}
                </h3>

                <p>
                  Quantity:{" "}
                  {item.quantity}
                </p>

                <p>
                  Price: ₹{item.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}