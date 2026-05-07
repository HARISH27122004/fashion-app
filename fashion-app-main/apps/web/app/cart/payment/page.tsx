"use client";

import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

import { useCheckout } from "@/contexts/CheckoutContext";
import { useCart } from "@/contexts/CartContext";

import { getProductById } from "@/data/products";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage() {
  const { shippingAddress } =
    useCheckout();

  const { cart, clearCart } =
    useCart();

  function loadRazorpay() {
    const script =
      document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    document.body.appendChild(script);

    script.onload = () => {
      openPayment();
    };
  }

  // RAZORPAY ORDER
  async function saveOrder() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first");
      return;
    }

    // TOTAL AMOUNT
    const totalAmount = cart.reduce(
      (sum, item) => {
        const product = getProductById(
          item.productId
        );

        if (!product) return sum;

        return (
          sum +
          product.price * item.quantity
        );
      },
      0
    );

    // FULL ADDRESS
    const fullAddress = [
      shippingAddress.addressLine1,
      shippingAddress.addressLine2,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.pincode,
      shippingAddress.country,
    ]
      .filter(Boolean)
      .join(", ");

    // SAVE ORDER
    const { data, error } =
      await supabase
        .from("orders")
        .insert([
          {
            user_id: user.id,

            customer_name:
              shippingAddress.fullName,

            phone:
              shippingAddress.phoneNumber,

            address: fullAddress,

            total_amount: totalAmount,

            payment_method:
              "Razorpay",

            payment_status: "Paid",

            orders_status:
              "Pending",
          },
        ])
        .select()
        .single();

    if (error) {
      console.log(error);

      alert(error.message);

      return;
    }

    // ORDER ID
    const orderId = data.id;

    // SAVE ORDER ITEMS
    const orderItems = cart.map(
      (item) => {
        const product =
          getProductById(
            item.productId
          );

        return {
          order_id: orderId,

          product_id:
            item.productId,

          product_name:
            product?.name,

          product_image:
            product?.image,

          quantity: item.quantity,

          price: product?.price,
        };
      }
    );

    const {
      error: itemsError,
    } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.log(itemsError);

      alert(
        "Failed to save order items"
      );

      return;
    }

    clearCart();

    window.location.href =
      "/order-success";
  }

  // CASH ON DELIVERY
  async function handleCOD() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first");
      return;
    }

    // TOTAL AMOUNT
    const totalAmount = cart.reduce(
      (sum, item) => {
        const product = getProductById(
          item.productId
        );

        if (!product) return sum;

        return (
          sum +
          product.price * item.quantity
        );
      },
      0
    );

    // FULL ADDRESS
const fullAddress = [
  shippingAddress.addressLine1,
  shippingAddress.addressLine2,
  shippingAddress.city,
  shippingAddress.state,
  shippingAddress.pincode,
  shippingAddress.country,
]
  .filter(Boolean)
  .join(", ");

    // SAVE ORDER
    const { data, error } =
      await supabase
        .from("orders")
        .insert([
          {
            user_id: user.id,

            customer_name:
              shippingAddress.fullName,

            phone:
              shippingAddress.phoneNumber,

            address: fullAddress,

            total_amount: totalAmount,

            payment_method:
              "Cash on Delivery",

            payment_status:
              "Pending",

            orders_status:
              "Pending",
          },
        ])
        .select()
        .single();

    if (error) {
      console.log(error);

      alert(error.message);

      return;
    }

    // ORDER ID
    const orderId = data.id;

    // SAVE ORDER ITEMS
    const orderItems = cart.map(
      (item) => {
        const product =
          getProductById(
            item.productId
          );

        return {
          order_id: orderId,

          product_id:
            item.productId,

          product_name:
            product?.name,

          product_image:
            product?.image,

          quantity: item.quantity,

          price: product?.price,
        };
      }
    );

    const {
      error: itemsError,
    } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.log(itemsError);

      alert(
        "Failed to save order items"
      );

      return;
    }

    clearCart();
    window.location.href =
      "/order-success";
  }

  function openPayment() {
    const options = {
      key: process.env
        .NEXT_PUBLIC_RAZORPAY_KEY_ID,

      amount: 157200,

      currency: "INR",

      name: "Fashion App",

      description:
        "Order Payment",

      handler: async function () {
        await saveOrder();
      },

      theme: {
        color: "#111111",
      },
    };

    const paymentObject =
      new window.Razorpay(options);

    paymentObject.open();
  }

  return (
    <>
      <Header
        showBack
        title="Payment"
      />

      <main
        style={{
          padding: "24px",
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        <h2>
          Select Payment Method
        </h2>

        <div
          style={{
            marginTop: "20px",
            display: "grid",
            gap: "12px",
          }}
        >
          {/* COD */}
          <button
            onClick={handleCOD}
            style={{
              padding: "16px",
              borderRadius: "14px",
              border:
                "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Cash on Delivery
          </button>

          {/* RAZORPAY */}
          <button
            onClick={loadRazorpay}
            style={{
              padding: "16px",
              borderRadius: "14px",
              border:
                "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Pay with Razorpay
          </button>
        </div>
      </main>
    </>
  );
}