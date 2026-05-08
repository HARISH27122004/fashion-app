"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface Notification {
  id: string;
  message: string;
  created_at: string;
  product_id?: string;
}

const STORAGE_KEY = "app_notifications";
const EVENT_NAME = "notifications_updated";

function readFromStorage(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeToStorage(notifications: Notification[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {}
}

export function addNotification(message: string, product_id?: string): Notification {
  const existing = readFromStorage();
  const newNotif: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    message: message.trim(),
    created_at: new Date().toISOString(),
    product_id,
  };
  writeToStorage([newNotif, ...existing]);
  return newNotif;
}

export function removeNotification(id: string) {
  writeToStorage(readFromStorage().filter((n) => n.id !== id));
}

export function clearAllNotifications() {
  writeToStorage([]);
}

export function useNotifications(): Notification[] {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const mountedRef = useRef(true);

  const sync = useCallback(() => {
    if (!mountedRef.current) return;
    setNotifications(readFromStorage());
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    sync();
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      mountedRef.current = false;
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  return notifications;
}