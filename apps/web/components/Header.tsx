"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./Header.module.css";
import { usePathname } from "next/navigation";

interface HeaderProps {
  showBack?: boolean;
  title?: string;
  showBookmark?: boolean;
  onMenuClick?: () => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
}

export default function Header({
  showBack = false,
  title,
  showBookmark = false,
  onMenuClick,
  onSearch,
  onClear,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const pathname = usePathname();

  const getTitle = () => {
    if (pathname === "/") return "STUDIO DIRT";
    if (pathname === "/bookmarks") return "BOOKMARK";
    if (pathname === "/cart") return "CART";
    if (pathname === "/notification") return "NOTIFICATION";
    if (pathname === "/orders") return "ORDERS";
    if (pathname === "/customize") return "CUSTOMIZE";
    if (pathname === "/product/") return "PRODUCT DETAILS";
    if (pathname === "/cart/address") return "ADDRESS";
    if (pathname === "/cart/payment") return "PAYMENT";
    return "PRODUCT DETAILS";
  };

  const handleChange = (val: string) => {
    setValue(val);
    onSearch?.(val.trim());
  };

  const handleClear = () => {
    setValue("");
    onSearch?.("");
    onClear?.();
    setOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>

        {/* LEFT — menu */}
        <button className={styles.iconBtn} onClick={onMenuClick}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" className={styles.MenuIcon}>
            <path d="M96 160C96 142.3 110.3 128 128 128L512 128C529.7 128 544 142.3 544 160C544 177.7 529.7 192 512 192L128 192C110.3 192 96 177.7 96 160zM96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320zM544 480C544 497.7 529.7 512 512 512L128 512C110.3 512 96 497.7 96 480C96 462.3 110.3 448 128 448L512 448C529.7 448 544 462.3 544 480z"/>
          </svg>
        </button>

        {/* TITLE */}
        <h1 className={styles.title}>{getTitle()}</h1>

        {/* SEARCH WRAPPER */}
        <div className={styles.searchWrapper}>
          <button
            className={styles.iconBtn}
            onClick={() => {
              if (open) {
                handleClear();
              } else {
                setOpen(true);
              }
            }}
            aria-label="Search"
          >
            {open ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <line x1="16" y1="16" x2="21" y2="21" />
              </svg>
            )}
          </button>

          <input
            className={`${styles.searchInput} ${open ? styles.active : ""}`}
            type="text"
            placeholder="Search..."
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            autoFocus={open}
          />
        </div>

        {/* BOOKMARK */}
        {showBookmark ? (
          <Link href="/bookmarks" className={styles.iconBtn}></Link>
        ) : null}
      </div>
    </header>
  );
}