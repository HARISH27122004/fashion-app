import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type CartItem = {
  productId: string;
  quantity: number;
  timestamp: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (productId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getQuantity: (productId: string) => number;
  totalItems: number;
  isLoading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'welcome-fashion-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    async function loadCart() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setCart(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        console.error('Failed to load cart:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCart();
  }, []);

  // Save cart to AsyncStorage when it changes
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cart)).catch((error) => {
        console.error('Failed to save cart:', error);
      });
    }
  }, [cart, isLoading]);

  const addToCart = (productId: string, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity, timestamp: Date.now() }
            : item
        );
      }
      return [...prev, { productId, quantity, timestamp: Date.now() }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity, timestamp: Date.now() } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getQuantity = (productId: string) => {
    const item = cart.find((item) => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getQuantity,
        totalItems,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
