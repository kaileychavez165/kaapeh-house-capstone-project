import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  category: string;
  image?: any;
  image_url?: string;
  available: boolean;
  size?: string;
  temperature?: string;
  quantity: number;
  customizations?: Record<string, string>; // subCategory -> customization name (e.g., "Milk" -> "2% Milk", "Syrup" -> "Vanilla")
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, options?: { size?: string; temperature?: string }) => void;
  clear: () => void;
  setQuantity: (id: string, quantity: number, options?: { size?: string; temperature?: string }) => void;
  pickupTime: Date | null;
  setPickupTime: (time: Date | null) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'kh_cart_v1';
const PICKUP_TIME_KEY = 'kh_pickup_time_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [pickupTime, setPickupTimeState] = useState<Date | null>(null);

  // Load cart items and pickup time on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setItems(parsed);
        }
      } catch (e) {
        // noop
      }
      
      try {
        const pickupTimeRaw = await AsyncStorage.getItem(PICKUP_TIME_KEY);
        if (pickupTimeRaw) {
          const parsedTime = new Date(pickupTimeRaw);
          // Only set if it's a valid date
          if (!isNaN(parsedTime.getTime())) {
            setPickupTimeState(parsedTime);
          }
        }
      } catch (e) {
        // noop
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items]);

  useEffect(() => {
    if (pickupTime) {
      AsyncStorage.setItem(PICKUP_TIME_KEY, pickupTime.toISOString()).catch(() => {});
    } else {
      AsyncStorage.removeItem(PICKUP_TIME_KEY).catch(() => {});
    }
  }, [pickupTime]);

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      // Merge by id + size + temperature + customizations
      const customizationsMatch = (a?: Record<string, string>, b?: Record<string, string>) => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        const aKeys = Object.keys(a).sort();
        const bKeys = Object.keys(b).sort();
        if (aKeys.length !== bKeys.length) return false;
        return aKeys.every(key => a[key] === b[key]);
      };
      
      const idx = prev.findIndex(
        i => i.id === item.id && 
        i.size === item.size && 
        i.temperature === item.temperature &&
        customizationsMatch(i.customizations, item.customizations)
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + (item.quantity || 1) };
        return copy;
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string, options?: { size?: string; temperature?: string }) => {
    setItems(prev => prev.filter(i => {
      const sizeMatches = options?.size ? i.size === options.size : true;
      const tempMatches = options?.temperature ? i.temperature === options.temperature : true;
      return !(i.id === id && sizeMatches && tempMatches);
    }));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setPickupTimeState(null);
  }, []);

  const setPickupTime = useCallback((time: Date | null) => {
    setPickupTimeState(time);
  }, []);

  const setQuantity = useCallback((id: string, quantity: number, options?: { size?: string; temperature?: string }) => {
    setItems(prev => prev.map(i => {
      const sizeMatches = options?.size ? i.size === options.size : true;
      const tempMatches = options?.temperature ? i.temperature === options.temperature : true;
      if (i.id === id && sizeMatches && tempMatches) {
        return { ...i, quantity: Math.max(1, quantity) };
      }
      return i;
    }));
  }, []);

  const value = useMemo(
    () => ({ items, addItem, removeItem, clear, setQuantity, pickupTime, setPickupTime }),
    [items, addItem, removeItem, clear, setQuantity, pickupTime, setPickupTime]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}




