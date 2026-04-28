"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Bookmark = {
  productId: string;
  timestamp: number;
};

type BookmarkContextType = {
  bookmarks: Bookmark[];
  addBookmark: (productId: string) => void;
  removeBookmark: (productId: string) => void;
  isBookmarked: (productId: string) => boolean;
  toggleBookmark: (productId: string) => void;
};

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

const STORAGE_KEY = 'welcome-fashion-bookmarks';

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBookmarks(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save bookmarks to localStorage when they change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
      } catch (error) {
        console.error('Failed to save bookmarks:', error);
      }
    }
  }, [bookmarks, isHydrated]);

  const addBookmark = (productId: string) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.productId === productId)) {
        return prev;
      }
      return [...prev, { productId, timestamp: Date.now() }];
    });
  };

  const removeBookmark = (productId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.productId !== productId));
  };

  const isBookmarked = (productId: string) => {
    return bookmarks.some((b) => b.productId === productId);
  };

  const toggleBookmark = (productId: string) => {
    if (isBookmarked(productId)) {
      removeBookmark(productId);
    } else {
      addBookmark(productId);
    }
  };

  return (
    <BookmarkContext.Provider
      value={{ bookmarks, addBookmark, removeBookmark, isBookmarked, toggleBookmark }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
}
