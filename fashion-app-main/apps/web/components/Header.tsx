import Link from "next/link";
import styles from "./Header.module.css";

interface HeaderProps {
  showBack?: boolean;
  title?: string;
  showBookmark?: boolean;
}

export default function Header({
  showBack = false,
  title,
  showBookmark = false,
}: HeaderProps) {
  return (
    <header className={styles.header} id="header">
      <div className={styles.inner}>
        {showBack ? (
          <Link href="/" className={styles.iconBtn} aria-label="Go back" id="header-back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        ) : (
          <button className={styles.iconBtn} aria-label="Menu" id="header-menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        <h1 className={styles.title}>{title || "WELCOME"}</h1>

        {showBookmark ? (
          <button className={styles.iconBtn} aria-label="Bookmark" id="header-bookmark">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </button>
        ) : (
          <button className={styles.iconBtn} aria-label="Search" id="header-search">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
