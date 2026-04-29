"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const {
      data: { user }
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

    fetchOrders();
  }

  async function fetchOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: false });

    if (data) setOrders(data);

    setLoading(false);
  }

  async function updateStatus(id: number, status: string) {
    await supabase
      .from("orders")
      .update({ orders_status: status })
      .eq("id", id);

    fetchOrders();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (loading) {
    return (
      <main style={{ padding: "24px" }}>
        <h2>Checking access...</h2>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h1>Admin Orders</h1>

        <button
          onClick={handleLogout}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            background: "black",
            color: "white"
          }}
        >
          Logout
        </button>
      </div>

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
            <h3>{order.customer_name}</h3>
            <p>Phone: {order.phone}</p>
            <p>Address: {order.address}</p>
            <p>Total: ₹{order.total_amount}</p>
            <p>Payment: {order.payment_status}</p>
            <p>Status: {order.order_status}</p>

            <select
              value={order.order_status}
              onChange={(e) =>
                updateStatus(order.id, e.target.value)
              }
              style={{
                marginTop: "12px",
                padding: "10px",
                borderRadius: "10px",
                width: "100%"
              }}
            >
              <option>Pending</option>
              <option>Packed</option>
              <option>Shipped</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
          </div>
        ))}
      </div>
    </main>
  );
}