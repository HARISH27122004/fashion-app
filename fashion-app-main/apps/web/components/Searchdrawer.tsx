// components/Searchdrawer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearch } from "@/contexts/SearchContext";
import styles from "./Searchdrawer.module.css";

interface SearchDrawerProps {
  open: boolean;
  onClose: () => void;
  /** @deprecated — live search now updates context directly; this prop is kept for API compat */
  onSearch?: (q: string) => void;
}

export default function SearchDrawer({ open, onClose }: SearchDrawerProps) {
  const { searchQuery, setSearchQuery, clearSearch } = useSearch();
  const [localValue, setLocalValue] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) {
      setLocalValue(searchQuery);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // Live update context on every keystroke
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setLocalValue(val);
    setSearchQuery(val);
  }

  // Clear everything
  function handleClear() {
    setLocalValue("");
    clearSearch();
    inputRef.current?.focus();
  }

  // Close drawer on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${open ? styles.backdropOpen : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer
          — On desktop: slides DOWN from top (translateY(-110%) → 0)
          — On mobile:  slides UP   from bottom (translateY(110%) → 0)
          Controlled purely via CSS classes + media query.
      */}
      <div
        className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}
        role="search"
        aria-label="Search products"
      >
        <div className={styles.inputRow}>
          {/* Search icon */}
          <svg className={styles.searchIcon} width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <line x1="16" y1="16" x2="21" y2="21" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Search products, categories…"
            value={localValue}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onClose();
                setTimeout(() => {
                  document.getElementById("product-grid")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }, 320);
              }
            }}
            autoComplete="off"
            spellCheck={false}
          />

          {/* Clear button — only when there's text */}
          {localValue && (
            <button
              className={styles.clearBtn}
              onClick={handleClear}
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {/* Close drawer */}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close search">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}