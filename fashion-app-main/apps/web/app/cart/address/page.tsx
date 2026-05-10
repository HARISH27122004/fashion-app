"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import { useCheckout } from "@/contexts/CheckoutContext";

import styles from "./page.module.css";

export default function AddressPage() {
  const router = useRouter();

  const { setShippingAddress } =
    useCheckout();

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [city, setCity] =
    useState("");

  const [pincode, setPincode] =
    useState("");

  const [address, setAddress] =
    useState("");

  // ERRORS
  const [nameError, setNameError] =
    useState("");

  const [
    phoneError,
    setPhoneError,
  ] = useState("");

  const [cityError, setCityError] =
    useState("");

  const [
    pincodeError,
    setPincodeError,
  ] = useState("");

  const [
    addressError,
    setAddressError,
  ] = useState("");

  async function handleSubmit() {
    // RESET ERRORS
    setNameError("");
    setPhoneError("");
    setCityError("");
    setPincodeError("");
    setAddressError("");

    let hasError = false;

    // FULL NAME
    if (!fullName.trim()) {
      setNameError(
        "Please fill out this field"
      );

      hasError = true;
    }

    // PHONE
    if (!phone.trim()) {
      setPhoneError(
        "Please fill out this field"
      );

      hasError = true;
    }

    // CITY
    if (!city.trim()) {
      setCityError(
        "Please fill out this field"
      );

      hasError = true;
    }

    // PINCODE
    if (!pincode.trim()) {
      setPincodeError(
        "Please fill out this field"
      );

      hasError = true;
    }

    // ADDRESS
    if (!address.trim()) {
      setAddressError(
        "Please fill out this field"
      );

      hasError = true;
    }

    // STOP SUBMIT
    if (hasError) return;

    // SAVE TO CHECKOUT CONTEXT
    setShippingAddress({
      fullName,

      phoneNumber: phone,

      addressLine1: address,

      city,

      pincode,

      state: "",

      country: "India",

      email: "",

      addressLine2: "",

      landmark: "",
    });

    // SAVE TO DATABASE
    const { error } =
      await supabase
        .from("addresses")
        .insert([
          {
            full_name:
              fullName,

            phone,

            city,

            pincode,

            address,
          },
        ]);

    if (error) {
      console.log(error);

      alert(
        "Failed to save address"
      );

      return;
    }

    router.push(
      "/cart/payment"
    );
  }

  return (
    <main className={styles.main}>
      <section
        className={styles.card}
      >
        <h2
          className={styles.heading}
        >
          Delivery Address
        </h2>

        <p
          className={styles.subtext}
        >
          Enter your shipping
          details below
        </p>

        {/* FULL NAME */}
        <div
          className={
            styles.formGroup
          }
        >
          <label
            className={styles.label}
          >
            Full Name
          </label>

          <input
            type="text"
            placeholder="Enter full name"
            className={
              styles.input
            }
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
              border:
                nameError
                  ? "1px solid red"
                  : undefined,
            }}
          />

          {nameError && (
            <p
              style={{
                color: "red",

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

        {/* PHONE */}
        <div
          className={
            styles.formGroup
          }
        >
          <label
            className={styles.label}
          >
            Phone Number
          </label>

          <input
            type="text"
            placeholder="Enter phone number"
            className={
              styles.input
            }
            value={phone}
            onChange={(e) => {
              setPhone(
                e.target.value
              );

              setPhoneError(
                ""
              );
            }}
            style={{
              border:
                phoneError
                  ? "1px solid red"
                  : undefined,
            }}
          />

          {phoneError && (
            <p
              style={{
                color: "red",

                fontSize:
                  "13px",

                marginTop:
                  "6px",
              }}
            >
              {phoneError}
            </p>
          )}
        </div>

        {/* CITY */}
        <div
          className={
            styles.formGroup
          }
        >
          <label
            className={styles.label}
          >
            City
          </label>

          <input
            type="text"
            placeholder="Enter city"
            className={
              styles.input
            }
            value={city}
            onChange={(e) => {
              setCity(
                e.target.value
              );

              setCityError(
                ""
              );
            }}
            style={{
              border:
                cityError
                  ? "1px solid red"
                  : undefined,
            }}
          />

          {cityError && (
            <p
              style={{
                color: "red",

                fontSize:
                  "13px",

                marginTop:
                  "6px",
              }}
            >
              {cityError}
            </p>
          )}
        </div>

        {/* PINCODE */}
        <div
          className={
            styles.formGroup
          }
        >
          <label
            className={styles.label}
          >
            Pincode
          </label>

          <input
            type="text"
            placeholder="Enter pincode"
            className={
              styles.input
            }
            value={pincode}
            onChange={(e) => {
              setPincode(
                e.target.value
              );

              setPincodeError(
                ""
              );
            }}
            style={{
              border:
                pincodeError
                  ? "1px solid red"
                  : undefined,
            }}
          />

          {pincodeError && (
            <p
              style={{
                color: "red",

                fontSize:
                  "13px",

                marginTop:
                  "6px",
              }}
            >
              {pincodeError}
            </p>
          )}
        </div>

        {/* ADDRESS */}
        <div
          className={
            styles.formGroup
          }
        >
          <label
            className={styles.label}
          >
            Full Address
          </label>

          <textarea
            placeholder="House no, street, landmark..."
            className={
              styles.textarea
            }
            value={address}
            onChange={(e) => {
              setAddress(
                e.target.value
              );

              setAddressError(
                ""
              );
            }}
            style={{
              border:
                addressError
                  ? "1px solid red"
                  : undefined,
            }}
          />

          {addressError && (
            <p
              style={{
                color: "red",

                fontSize:
                  "13px",

                marginTop:
                  "6px",
              }}
            >
              {addressError}
            </p>
          )}
        </div>

        {/* BUTTON */}
        <button
          className={styles.button}
          onClick={handleSubmit}
        >
          Continue to Payment
        </button>
      </section>
    </main>
  );
}