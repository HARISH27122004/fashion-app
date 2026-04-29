"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleAuth() {
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        alert(error.message);
        return;
      }

      if (data.user) {
        await supabase.from("profiles").insert([
          {
            id: data.user.id,
            full_name: fullName,
            role: "user"
          }
        ]);
      }

      alert("Signup successful");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

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
        padding: "24px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          border: "1px solid #eee",
          padding: "24px",
          borderRadius: "20px"
        }}
      >
        <h1>{isSignup ? "Create Account" : "Login"}</h1>

        {isSignup && (
          <input
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "14px"
            }}
          />
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "14px"
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "14px"
          }}
        />

        <button
          onClick={handleAuth}
          style={{
            width: "100%",
            padding: "14px",
            marginTop: "18px",
            background: "black",
            color: "white",
            borderRadius: "12px"
          }}
        >
          {isSignup ? "Sign Up" : "Login"}
        </button>

        <button
          onClick={() => setIsSignup(!isSignup)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            background: "transparent"
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