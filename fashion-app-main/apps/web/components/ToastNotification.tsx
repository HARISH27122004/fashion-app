"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ToastNotification.module.css";

export interface ToastItem {
  id: string;
  message: string;
  product_id?: string;
}

interface Props {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export default function ToastNotification({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null;
  return (
    <div className={styles.container} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"entering" | "visible" | "hiding">("entering");
  const router = useRouter();

  useEffect(() => {
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => setPhase("visible"));
      return () => cancelAnimationFrame(r2);
    });
    return () => cancelAnimationFrame(r1);
  }, []);

  function dismiss() {
    setPhase("hiding");
    const el = ref.current;
    if (!el) { onDismiss(toast.id); return; }
    el.addEventListener("transitionend", () => onDismiss(toast.id), { once: true });
    setTimeout(() => onDismiss(toast.id), 350);
  }

  function handleToastClick() {
    if (toast.product_id) {
      dismiss();
      router.push(`/product/${toast.product_id}`);
    }
  }

  const phaseClass =
    phase === "visible" ? styles.visible :
    phase === "hiding"  ? styles.hiding  : "";

  return (
    <div
      ref={ref}
      className={`${styles.toast} ${phaseClass} ${toast.product_id ? styles.clickable : ""}`}
      role="status"
      onClick={handleToastClick}
    >
      {/* Icon */}
      <div className={styles.iconWrap}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L15.5 8.5H21L16.5 13L18.5 20L12 16L5.5 20L7.5 13L3 8.5H8.5L12 2Z"
            fill="#ff6b35"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span className={styles.tag}>OFFER</span>
          <p className={styles.title}>{toast.message}</p>
        </div>
        {toast.product_id && (
          <p className={styles.subtitle}>Tap to view product →</p>
        )}
      </div>

      {/* Close */}
      <button
        className={styles.closeBtn}
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        aria-label="Dismiss notification"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}