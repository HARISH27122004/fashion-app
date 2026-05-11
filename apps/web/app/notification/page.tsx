"use client";

import { useEffect, useState } from "react";
import {
  useNotifications,
  removeNotification,
  clearAllNotifications,
} from "@/hooks/useNotifications";
import styles from "./notification.module.css";

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false);
  const notifications = useNotifications();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Notifications</h1>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.loadingWrap}>
            <span className={styles.loadingDot} />
            <span className={styles.loadingDot} />
            <span className={styles.loadingDot} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.heading}>Notifications</h1>
          {notifications.length > 0 && (
            <span className={styles.countBadge}>{notifications.length}</span>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            className={styles.clearBtn}
            onClick={clearAllNotifications}
            aria-label="Clear all notifications"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrap}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>You&apos;re all caught up!</p>
          <p className={styles.emptySub}>New notifications will appear here.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {notifications.map((notif, i) => (
            <li
              key={notif.id}
              className={styles.item}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Left accent + icon */}
              <div className={styles.iconCol}>
                <div className={styles.iconCircle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                </div>
                <div className={styles.iconLine} />
              </div>

              {/* Content */}
              <div className={styles.content}>
                <div className={styles.contentTop}>
                  <span className={styles.tag}>OFFER</span>
                  <time className={styles.time} dateTime={notif.created_at}>
                    {new Date(notif.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className={styles.message}>{notif.message}</p>
              </div>

              {/* Delete */}
              <button
                className={styles.deleteBtn}
                onClick={() => removeNotification(notif.id)}
                aria-label="Remove notification"
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M1 1l10 10M11 1L1 11"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}