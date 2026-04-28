"use client";

import { useCheckout } from "@/contexts/CheckoutContext";
import styles from "./CheckoutStepper.module.css";

export const CheckoutSteps: readonly CheckoutStep[] = ["cart", "address", "payment", "success", "tracking"];

export function CheckoutStepper() {
  const { step } = useCheckout();

  return (
    <div className={styles.stepper}>
      {CheckoutSteps.map((stepName, index) => (
        <div
          key={stepName}
          className={`${styles.step} ${stepName === step ? styles.active : ""} ${stepName < step ? styles.completed : ""}`}
        >
          <div className={styles.stepCircle}>
            {stepName < step ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <div className={styles.stepNumber}>{index + 1}</div>
            )}
          </div>
          {index < CheckoutSteps.length - 1 && (
            <div className={styles.stepLine}>
              <div className={`${styles.stepLineFill} ${stepName < step ? styles.active : ""}`}></div>
            </div>
          )}
          <div className={styles.stepLabel}>
            {stepName === "cart" ? "Cart" : stepName === "address" ? "Address" : stepName === "payment" ? "Payment Method" : stepName === "success" ? "Order Placed" : "Order Tracking"}
          </div>
        </div>
      ))}
    </div>
  );
}