"use client";

import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage() {
  function loadRazorpay() {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      openPayment();
    };
  }

  async function saveOrder() {
    await supabase.from("orders").insert([
      {
        customer_name: "Harish",
        phone: "9876543210",
        address: "Chennai",
        total_amount: 1572,
        payment_method: "Razorpay",
        payment_status: "Paid"
      }
    ]);
  }

  function openPayment() {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: 157200,
      currency: "INR",
      name: "Fashion App",
      description: "Order Payment",

      handler: async function () {
        await saveOrder();
        alert("Payment Successful & Order Saved");
      },

      theme: {
        color: "#111111"
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  }

  return (
    <>
      <Header showBack title="Payment" />

      <main
        style={{
          padding: "24px",
          maxWidth: "500px",
          margin: "0 auto"
        }}
      >
        <h2>Select Payment Method</h2>

        <div
          style={{
            marginTop: "20px",
            display: "grid",
            gap: "12px"
          }}
        >
          <button
            style={{
              padding: "16px",
              borderRadius: "14px",
              border: "1px solid #ddd",
              background: "#fff"
            }}
          >
            Cash on Delivery
          </button>

          <button
            onClick={loadRazorpay}
            style={{
              padding: "16px",
              borderRadius: "14px",
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer"
            }}
          >
            Pay with Razorpay
          </button>
        </div>
      </main>
    </>
  );
}