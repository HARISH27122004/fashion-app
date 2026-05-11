import AsyncStorage from '@react-native-async-storage/async-storage';
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
  isLoading: boolean;
};

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

const STORAGE_KEY = 'welcome-fashion-bookmarks';

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load bookmarks from AsyncStorage on mount
  useEffect(() => {
    async function loadBookmarks() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setBookmarks(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadBookmarks();
  }, []);

  // Save bookmarks to AsyncStorage when they change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks)).catch((error) => {
        console.error('Failed to save bookmarks:', error);
      });
    }
  }, [bookmarks, isLoading]);

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
      value={{ bookmarks, addBookmark, removeBookmark, isBookmarked, toggleBookmark, isLoading }}
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
