"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  qty: number;
  stock: number;
};

type Added = { name: string; image: string | null; at: number } | null;

type Cart = {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  /** Update name/price/stock/photo of an item already in the cart (no message shown). */
  refresh: (item: Omit<CartItem, "qty">) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  added: Added;
  dismissAdded: () => void;
};

const KEY = "gad-cart-v1";
const Ctx = createContext<Cart | null>(null);

function read(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.id && i.qty > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [added, setAdded] = useState<Added>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load the saved cart once after mount
    setItems(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === KEY && setItems(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // Private mode: the cart still works for this visit.
    }
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((list) => {
      const max = Math.max(1, item.stock);
      const found = list.find((i) => i.id === item.id);
      if (found) return list.map((i) => (i.id === item.id ? { ...i, ...item, qty: Math.min(max, i.qty + qty) } : i));
      return [...list, { ...item, qty: Math.min(max, qty) }];
    });
    setAdded({ name: item.name, image: item.image, at: Date.now() });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems((list) =>
      list
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, Math.min(Math.max(1, i.stock), qty)) } : i))
        .filter((i) => i.qty > 0),
    );
  }, []);

  const refresh = useCallback((item: Omit<CartItem, "qty">) => {
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, ...item } : i)));
  }, []);

  const remove = useCallback((id: string) => setItems((list) => list.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const dismissAdded = useCallback(() => setAdded(null), []);

  const value = useMemo<Cart>(
    () => ({
      items,
      ready,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.qty * i.price, 0),
      add,
      refresh,
      setQty,
      remove,
      clear,
      added,
      dismissAdded,
    }),
    [items, ready, add, refresh, setQty, remove, clear, added, dismissAdded],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
