"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

export default function OrderSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/orders");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f7f7f7",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "24px",
          textAlign: "center",
          boxShadow:
            "0 10px 40px rgba(0,0,0,0.08)",
          maxWidth: "420px",
          width: "100%",
        }}
      >
        {/* SUCCESS ICON */}
        <div
          style={{
            width: "90px",
            height: "90px",
            borderRadius: "50%",
            background: "#111",
            color: "#fff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "42px",
            margin: "0 auto 24px",
          }}
        >
          ✓
        </div>

        <h1
          style={{
            fontSize: "32px",
            marginBottom: "12px",
          }}
        >
          Order Placed!
        </h1>

        <p
          style={{
            color: "#666",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          Your order has been placed
          successfully.
          <br />
          Redirecting to your orders...
        </p>

        {/* LOADER */}
        <div
          style={{
            width: "100%",
            height: "6px",
            background: "#eee",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#111",
              animation:
                "loading 3s linear forwards",
            }}
          />
        </div>

        <style jsx>{`
          @keyframes loading {
            from {
              width: 0%;
            }

            to {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </main>
  );
}