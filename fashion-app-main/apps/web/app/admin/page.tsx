"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    if (data) {
      setOrders(data);
    }
  }

  return (
    <main style={{ padding: "24px" }}>
      <h1>Admin Orders</h1>

      <div style={{ marginTop: "20px", display: "grid", gap: "16px" }}>
        {orders.map((order) => (
          <div
            key={order.id}
            style={{
              border: "1px solid #ddd",
              padding: "16px",
              borderRadius: "14px"
            }}
          >
            <h3>{order.customer_name}</h3>
            <p>Phone: {order.phone}</p>
            <p>Address: {order.address}</p>
            <p>Total: ₹{order.total_amount}</p>
            <p>Payment: {order.payment_status}</p>
          </div>
        ))}
      </div>
    </main>
  );
}