"use client";

import { useCallback, useEffect, useState } from "react";

type CartItem = { partNo: string; qty: number };
type Cart = { id: string; items: CartItem[] };

export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      const data = await res.json();
      setCart(data.cart);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (partNo: string, qty = 1) => {
    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "add", partNo, qty }),
    });
    const data = await res.json();
    setCart(data.cart);
  }, []);

  const setQty = useCallback(async (partNo: string, qty: number) => {
    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "set", partNo, qty }),
    });
    const data = await res.json();
    setCart(data.cart);
  }, []);

  const remove = useCallback(async (partNo: string) => {
    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "remove", partNo }),
    });
    const data = await res.json();
    setCart(data.cart);
  }, []);

  return { cart, items: cart?.items ?? [], loading, refresh, add, setQty, remove };
}
