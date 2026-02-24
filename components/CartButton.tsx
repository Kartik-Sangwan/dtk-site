"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CART_SERVER_EVENT } from "@/lib/cart-client";

function CartIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M6.5 6.5h14l-1.3 7.1a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.6L5.6 4.8A1.5 1.5 0 0 0 4.1 3.5H2.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 20a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM17.5 20a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CartRes = {
  ok: boolean;
  cart?: { id: string; items: { partNo: string; qty: number }[] };
};

export default function CartButton() {
  const [count, setCount] = useState(0);

  const label = useMemo(() => {
    if (count === 0) return "Cart";
    return `Cart (${count})`;
  }, [count]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as CartRes;
      const items = data?.cart?.items ?? [];
      const qty = items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
      setCount(qty);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refresh();

    const onCartUpdated = () => refresh();
    const onFocus = () => refresh();
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener(CART_SERVER_EVENT, onCartUpdated as EventListener);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener(CART_SERVER_EVENT, onCartUpdated as EventListener);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  return (
    <Link
      href="/checkout"
      aria-label={label}
      className="relative inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-slate-50"
    >
      <CartIcon />
      <span className="ml-2 hidden sm:inline">Cart</span>

      {count > 0 && (
        <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-900 px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
