"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [isSignup, setIsSignup] =
    useState(false);

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  // ERRORS
  const [nameError, setNameError] =
    useState("");

  const [emailError, setEmailError] =
    useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  async function handleAuth() {
    // RESET ERRORS
    setNameError("");
    setEmailError("");
    setPasswordError("");

    let hasError = false;

    // FULL NAME VALIDATION
    if (
      isSignup &&
      !fullName.trim()
    ) {
      setNameError(
        "Please fill out this field"
      );

      hasError = true;
    }

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

    // STOP AUTH
    if (hasError) return;

    // SIGNUP
    if (isSignup) {
      const {
        data,
        error,
      } =
        await supabase.auth.signUp(
          {
            email,
            password,
          }
        );

      if (error) {
        alert(error.message);

        return;
      }

      // CREATE PROFILE
      if (data.user) {
        await supabase
          .from("profiles")
          .insert([
            {
              id: data.user.id,

              full_name:
                fullName,

              role: "user",
            },
          ]);
      }

      alert(
        "Signup successful"
      );

      router.push("/");
    }

    // LOGIN
    else {
      const { error } =
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

      router.push("/");
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
          {isSignup
            ? "Create Account"
            : "Login"}
        </h1>

        <p
          style={{
            color: "#666",

            marginBottom: "24px",
          }}
        >
          {isSignup
            ? "Create your account"
            : "Welcome back"}
        </p>

        {/* FULL NAME */}
        {isSignup && (
          <div
            style={{
              marginBottom:
                "16px",
            }}
          >
            <input
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => {
                setFullName(
                  e.target.value
                );

                setNameError(
                  ""
                );
              }}
              style={{
                width: "100%",

                padding:
                  "14px",

                borderRadius:
                  "14px",

                border:
                  nameError
                    ? "1px solid red"
                    : "1px solid #ddd",

                outline:
                  "none",
              }}
            />

            {nameError && (
              <p
                style={{
                  color:
                    "red",

                  fontSize:
                    "13px",

                  marginTop:
                    "6px",
                }}
              >
                {nameError}
              </p>
            )}
          </div>
        )}

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

              borderRadius:
                "14px",

              border:
                emailError
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

              borderRadius:
                "14px",

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

        {/* AUTH BUTTON */}
        <button
          onClick={handleAuth}
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
          {isSignup
            ? "Sign Up"
            : "Login"}
        </button>

        {/* TOGGLE */}
        <button
          onClick={() =>
            setIsSignup(
              !isSignup
            )
          }
          style={{
            width: "100%",

            padding: "12px",

            marginTop: "12px",

            background:
              "transparent",

            border: "none",

            cursor: "pointer",

            color: "#555",
          }}
        >
          {isSignup
            ? "Already have account? Login"
            : "New user? Create account"}
        </button>
      </div>
    </main>
  );
}