"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

export default function AddressPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");

  async function handleSubmit() {
    const { error } = await supabase.from("addresses").insert([
      {
        full_name: fullName,
        phone,
        city,
        pincode,
        address
      }
    ]);

    if (error) {
      console.log(error);
      alert("Failed to save address");
      return;
    }

    router.push("/cart/payment");
  }

  return (
    <>
      <Header showBack title="Address" />

      <main className={styles.main}>
        <section className={styles.card}>
          <h2 className={styles.heading}>Delivery Address</h2>
          <p className={styles.subtext}>
            Enter your shipping details below
          </p>

          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input
              type="text"
              placeholder="Enter full name"
              className={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Phone Number</label>
            <input
              type="text"
              placeholder="Enter phone number"
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>City</label>
            <input
              type="text"
              placeholder="Enter city"
              className={styles.input}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Pincode</label>
            <input
              type="text"
              placeholder="Enter pincode"
              className={styles.input}
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Full Address</label>
            <textarea
              placeholder="House no, street, landmark..."
              className={styles.textarea}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <button
            className={styles.button}
            onClick={handleSubmit}
          >
            Continue to Payment
          </button>
        </section>
      </main>
    </>
  );
}