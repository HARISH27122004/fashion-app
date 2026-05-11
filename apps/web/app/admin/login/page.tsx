"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  // ERRORS
  const [emailError, setEmailError] =
    useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  async function handleLogin() {
    // RESET ERRORS
    setEmailError("");
    setPasswordError("");

    let hasError = false;

    // EMAIL VALIDATION
    if (!email.trim()) {
      setEmailError(
        "Please fill out this field"
      );

      hasError = true;
    }

    // PASSWORD VALIDATION
    if (!password.trim()) {
      setPasswordError(
        "Please fill out this field"
      );

      hasError = true;
    }

    // STOP LOGIN
    if (hasError) return;

    const {
      data: authData,
      error,
    } =
      await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    if (error) {
      alert(error.message);

      return;
    }

    const userId =
      authData.user.id;

    const { data } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

    // ADMIN
    if (
      data?.role === "admin"
    ) {
      router.push("/admin");
    }

    // NOT ADMIN
    else {
      alert(
        "Not an admin account"
      );
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",

        display: "grid",

        placeItems: "center",

        padding: "24px",

        background: "#f8f8f8",
      }}
    >
      <div
        style={{
          width: "100%",

          maxWidth: "420px",

          border:
            "1px solid #eee",

          padding: "28px",

          borderRadius: "24px",

          background: "#fff",

          boxShadow:
            "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <h1
          style={{
            fontSize: "32px",

            fontWeight: 700,

            marginBottom: "6px",
          }}
        >
          Admin Login
        </h1>

        <p
          style={{
            color: "#666",

            marginBottom: "24px",
          }}
        >
          Login to access admin
          dashboard
        </p>

        {/* EMAIL */}
        <div
          style={{
            marginBottom: "16px",
          }}
        >
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(
                e.target.value
              );

              setEmailError("");
            }}
            style={{
              width: "100%",

              padding: "14px",

              borderRadius: "14px",

              border: emailError
                ? "1px solid red"
                : "1px solid #ddd",

              outline: "none",
            }}
          />

          {emailError && (
            <p
              style={{
                color: "red",

                fontSize: "13px",

                marginTop: "6px",
              }}
            >
              {emailError}
            </p>
          )}
        </div>

        {/* PASSWORD */}
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(
                e.target.value
              );

              setPasswordError(
                ""
              );
            }}
            style={{
              width: "100%",

              padding: "14px",

              borderRadius: "14px",

              border:
                passwordError
                  ? "1px solid red"
                  : "1px solid #ddd",

              outline: "none",
            }}
          />

          {passwordError && (
            <p
              style={{
                color: "red",

                fontSize: "13px",

                marginTop: "6px",
              }}
            >
              {passwordError}
            </p>
          )}
        </div>

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          style={{
            width: "100%",

            padding: "14px",

            marginTop: "10px",

            background: "black",

            color: "white",

            borderRadius: "14px",

            border: "none",

            cursor: "pointer",

            fontWeight: 600,

            fontSize: "15px",
          }}
        >
          Login as Admin
        </button>
      </div>
    </main>
  );
}