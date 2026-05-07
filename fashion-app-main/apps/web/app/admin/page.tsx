"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();

  const [orders, setOrders] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [expandedOrder, setExpandedOrder] =
    useState<number | null>(null);

  const [orderItems, setOrderItems] =
    useState<any>({});

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

    fetchOrders();
  }

  async function fetchOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("id", {
        ascending: false,
      });

    if (data) {
      setOrders(data);
    }

    setLoading(false);
  }

  async function fetchOrderItems(
    orderId: number
  ) {
    // TOGGLE CLOSE
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }

    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    setOrderItems((prev: any) => ({
      ...prev,
      [orderId]: data || [],
    }));

    setExpandedOrder(orderId);
  }

  async function updateStatus(
    id: number,
    status: string
  ) {
    await supabase
      .from("orders")
      .update({
        orders_status: status,
      })
      .eq("id", id);

    fetchOrders();
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/admin/login");
  }

  if (loading) {
    return (
      <main
        style={{
          padding: "24px",
        }}
      >
        <h2>Checking access...</h2>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "24px",
        background: "#f7f7f7",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "36px",
              marginBottom: "8px",
            }}
          >
            Admin Dashboard
          </h1>

          <p
            style={{
              color: "#666",
            }}
          >
            Manage orders and
            shipments
          </p>
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

      {/* ORDERS */}
      <div
        style={{
          display: "grid",
          gap: "22px",
        }}
      >
        {orders.map((order) => (
          <div
            key={order.id}
            style={{
              background: "#fff",
              borderRadius: "24px",
              padding: "24px",
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.05)",
              border:
                "1px solid #eee",
            }}
          >
            {/* TOP */}
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "flex-start",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "24px",
                    marginBottom: "10px",
                  }}
                >
                  Order #{order.id}
                </h2>

                <div
                  style={{
                    display: "grid",
                    gap: "8px",
                    color: "#444",
                  }}
                >
                  <p>
                    <strong>
                      Customer:
                    </strong>{" "}
                    {
                      order.customer_name
                    }
                  </p>

                  <p>
                    <strong>
                      Phone:
                    </strong>{" "}
                    {order.phone}
                  </p>

                  <p>
                    <strong>
                      Address:
                    </strong>{" "}
                    {order.address}
                  </p>

                  <p>
                    <strong>
                      Total:
                    </strong>{" "}
                    ₹
                    {
                      order.total_amount
                    }
                  </p>

                  <p>
                    <strong>
                      Payment:
                    </strong>{" "}
                    {
                      order.payment_method
                    }{" "}
                    (
                    {
                      order.payment_status
                    }
                    )
                  </p>
                </div>
              </div>

              {/* STATUS */}
              <div
                style={{
                  minWidth: "220px",
                }}
              >
                <div
                  style={{
                    marginBottom: "12px",
                    padding:
                      "10px 16px",
                    borderRadius:
                      "999px",

                    display:
                      "inline-block",

                    background:
                      order.orders_status ===
                      "Delivered"
                        ? "#dcfce7"
                        : order.orders_status ===
                            "Cancelled"
                          ? "#fee2e2"
                          : "#fef3c7",

                    color:
                      order.orders_status ===
                      "Delivered"
                        ? "#166534"
                        : order.orders_status ===
                            "Cancelled"
                          ? "#991b1b"
                          : "#92400e",

                    fontWeight: 700,
                  }}
                >
                  {
                    order.orders_status
                  }
                </div>

                <select
                  value={
                    order.orders_status
                  }
                  onChange={(e) =>
                    updateStatus(
                      order.id,
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius:
                      "14px",
                    border:
                      "1px solid #ddd",
                    background:
                      "#fff",
                    fontSize: "15px",
                  }}
                >
                  <option>
                    Pending
                  </option>

                  <option>
                    Packed
                  </option>

                  <option>
                    Shipped
                  </option>

                  <option>
                    Delivered
                  </option>

                  <option>
                    Cancelled
                  </option>
                </select>
              </div>
            </div>

            {/* VIEW ITEMS */}
            <button
              onClick={() =>
                fetchOrderItems(
                  order.id
                )
              }
              style={{
                marginTop: "22px",
                padding:
                  "12px 18px",
                borderRadius:
                  "14px",
                border: "none",
                background: "#111",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {expandedOrder ===
              order.id
                ? "Hide Items"
                : "View Ordered Items"}
            </button>

            {/* ORDER ITEMS */}
            {expandedOrder ===
              order.id && (
              <div
                style={{
                  marginTop: "24px",
                  display: "grid",
                  gap: "16px",
                }}
              >
                {orderItems[
                  order.id
                ]?.map(
                  (item: any) => (
                    <div
                      key={item.id}
                      style={{
                        display:
                          "flex",

                        gap: "16px",

                        alignItems:
                          "center",

                        border:
                          "1px solid #eee",

                        borderRadius:
                          "18px",

                        padding:
                          "16px",
                      }}
                    >
                      <img
                        src={
                          item.product_image
                        }
                        alt={
                          item.product_name
                        }
                        style={{
                          width:
                            "90px",

                          height:
                            "90px",

                          objectFit:
                            "cover",

                          borderRadius:
                            "14px",
                        }}
                      />

                      <div>
                        <h3
                          style={{
                            marginBottom:
                              "8px",
                          }}
                        >
                          {
                            item.product_name
                          }
                        </h3>

                        <p>
                          Quantity:{" "}
                          {
                            item.quantity
                          }
                        </p>

                        <p>
                          Price:
                          ₹
                          {
                            item.price
                          }
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}