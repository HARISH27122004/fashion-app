"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  async function fetchMyOrders() {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    if (data) {
      setOrders(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main style={{ padding: "24px" }}>
        <h2>Loading orders...</h2>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px" }}>
      <h1>My Orders</h1>

      <div
        style={{
          marginTop: "20px",
          display: "grid",
          gap: "16px"
        }}
      >
        {orders.map((order) => (
          <div
            key={order.id}
            style={{
              border: "1px solid #ddd",
              padding: "16px",
              borderRadius: "14px"
            }}
          >
            <h3>Order #{order.id}</h3>
            <p>Total: ₹{order.total_amount}</p>
            <p>Payment: {order.payment_status}</p>
            <p>Status: {order.orders_status}</p>
            <p>Address: {order.address}</p>
          </div>
        ))}

        {orders.length === 0 && (
          <p>No orders found.</p>
        )}
      </div>
    </main>
  );
}