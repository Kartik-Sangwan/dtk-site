"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { notifyCartUpdated, CART_SERVER_EVENT } from "@/lib/cart-client";

type CartLine = { partNo: string; qty: number };

/** What your Checkout UI renders */
type SummaryLine = {
  partNo: string;
  qty: number;
  name?: string;
  subcategory?: string;
  image?: string;
  price: number; // dollars
  lineTotal: number; // dollars
};

type Summary = {
  lineItems: SummaryLine[];
  subtotal: number; // dollars
  shipping: number; // dollars
  tax: number; // dollars
  total: number; // dollars
};

/** What /api/cart returns */
type CartRes = {
  ok: boolean;
  cart?: { id: string; items: CartLine[] };
};

/** Newer summary route shape (cents-based) */
type SummaryCentsRes = {
  currency?: string;
  subtotalCents?: number;
  shippingCents?: number;
  taxCents?: number;
  totalCents?: number;
  items?: Array<{
    partNo: string;
    qty: number;
    name?: string;
    subcategory?: string;
    images?: string[];
    unitPriceCents: number;
  }>;
};

/** Older summary route shape (dollars-based) */
type SummaryDollarsRes = {
  lineItems?: Array<{
    partNo: string;
    qty: number;
    name?: string;
    subcategory?: string;
    image?: string;
    price: number;
    lineTotal: number;
  }>;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  total?: number;
};

function dollarsFromCents(cents: number | undefined | null) {
  return (Number(cents) || 0) / 100;
}

function formatMoney(n: number) {
  return `$${(Number(n) || 0).toFixed(2)}`;
}

/** Accept both server response shapes and normalize to Summary */
function normalizeSummary(data: unknown): Summary | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  // Case A) cents-based { subtotalCents, items: [...] }
  if (typeof d.subtotalCents === "number" && Array.isArray(d.items)) {
    const items = d.items as SummaryCentsRes["items"];

    const lineItems: SummaryLine[] = (items ?? []).map((it) => {
      const unit = dollarsFromCents(it.unitPriceCents);
      const qty = Number(it.qty) || 0;
      return {
        partNo: it.partNo,
        qty,
        name: it.name ?? it.partNo,
        subcategory: it.subcategory,
        image: it.images?.[0] ?? "/products/alignment-coupler.png",
        price: unit,
        lineTotal: unit * qty,
      };
    });

    const subtotal = dollarsFromCents(d.subtotalCents as number);
    const shipping = dollarsFromCents(d.shippingCents as number | undefined);
    const tax = dollarsFromCents(d.taxCents as number | undefined);

    // if server didn’t send totalCents, compute from parts
    const total =
      typeof d.totalCents === "number"
        ? dollarsFromCents(d.totalCents)
        : subtotal + shipping + tax;

    return { lineItems, subtotal, shipping, tax, total };
  }

  // Case B) dollars-based { lineItems, subtotal, shipping, tax, total }
  if (Array.isArray(d.lineItems)) {
    const dollars = d as unknown as SummaryDollarsRes;

    const lineItems: SummaryLine[] = (dollars.lineItems ?? []).map((it) => ({
      partNo: it.partNo,
      qty: Number(it.qty) || 0,
      name: it.name ?? it.partNo,
      subcategory: it.subcategory,
      image: it.image ?? "/products/alignment-coupler.png",
      price: Number(it.price) || 0,
      lineTotal: Number(it.lineTotal) || (Number(it.price) || 0) * (Number(it.qty) || 0),
    }));

    const subtotal = Number(dollars.subtotal) || lineItems.reduce((s, it) => s + it.lineTotal, 0);
    const shipping = Number(dollars.shipping) || 0;
    const tax = Number(dollars.tax) || 0;
    const total = Number(dollars.total) || subtotal + shipping + tax;

    return { lineItems, subtotal, shipping, tax, total };
  }

  return null;
}

export default function CheckoutClient() {
  const [cartItems, setCartItems] = useState<CartLine[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyPartNo, setBusyPartNo] = useState<string | null>(null);

  const hasItems = cartItems.length > 0;

  const itemCount = useMemo(
    () => cartItems.reduce((sum, it) => sum + (it.qty ?? 0), 0),
    [cartItems]
  );

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as CartRes;
      setCartItems(data?.cart?.items ?? []);
    } catch {
      // ignore
    }
  }, []);

  const refreshSummary = useCallback(async (items: CartLine[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        setSummary(null);
        return;
      }

      const data = await res.json();
      setSummary(normalizeSummary(data));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + keep in sync
  useEffect(() => {
    refreshCart();

    const onUpdated = () => refreshCart();
    const onFocus = () => refreshCart();
    const onVis = () => {
      if (document.visibilityState === "visible") refreshCart();
    };

    window.addEventListener(CART_SERVER_EVENT, onUpdated as EventListener);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener(CART_SERVER_EVENT, onUpdated as EventListener);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refreshCart]);

  // Recompute summary whenever cart changes
  useEffect(() => {
    refreshSummary(cartItems);
  }, [cartItems, refreshSummary]);

  async function cartPost(body: { op: "remove" | "set"; partNo: string; qty?: number }) {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    notifyCartUpdated();
  }

  async function onRemove(partNo: string) {
    setBusyPartNo(partNo);
    try {
      await cartPost({ op: "remove", partNo });
      await refreshCart();
    } finally {
      setBusyPartNo(null);
    }
  }

  async function setQty(partNo: string, qty: number) {
    const q = Math.max(0, Math.floor(Number(qty || 0)));
    setBusyPartNo(partNo);
    try {
      await cartPost({ op: "set", partNo, qty: q });
      await refreshCart();
    } finally {
      setBusyPartNo(null);
    }
  }

  function dec(partNo: string, current: number) {
    setQty(partNo, Math.max(1, current - 1));
  }

  function inc(partNo: string, current: number) {
    setQty(partNo, current + 1);
  }

  async function onClear() {
    setLoading(true);
    try {
      await Promise.all(cartItems.map((it) => cartPost({ op: "remove", partNo: it.partNo })));
      await refreshCart();
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  const effectiveLineItems: SummaryLine[] =
    summary?.lineItems ??
    cartItems.map((it) => ({
      partNo: it.partNo,
      qty: it.qty,
      name: it.partNo,
      subcategory: "",
      image: "/products/alignment-coupler.png",
      price: 0,
      lineTotal: 0,
    }));

  const subtotal = summary?.subtotal ?? effectiveLineItems.reduce((s, it) => s + it.lineTotal, 0);
  const shipping = summary?.shipping ?? (hasItems ? 0 : 0);
  const tax = summary?.tax ?? 0;
  const total = summary?.total ?? subtotal + shipping + tax;

  if (!hasItems) {
    return (
      <div className="rounded-2xl border border-slate-300 bg-white p-8 shadow-sm">
        <div className="text-2xl font-semibold text-gray-900">Your cart is empty</div>
        <p className="mt-2 text-sm text-gray-700">
          Add items from any product page using <span className="font-semibold">Add to Cart</span>.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-md bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_440px]">
      {/* LEFT: cart items */}
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-gray-600">Cart Items</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">{itemCount} item(s)</div>
          </div>

          <button
            onClick={onClear}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-slate-50 disabled:opacity-50"
            disabled={loading}
          >
            Clear cart
          </button>
        </div>

        <ul className="divide-y divide-slate-200">
          {effectiveLineItems.map((it) => {
            const img = it.image || "/products/alignment-coupler.png";
            const isBusy = busyPartNo === it.partNo;

            return (
              <li key={it.partNo} className="p-6 md:p-7">
                <div className="flex gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <Image src={img} alt={it.partNo} fill className="object-contain" sizes="80px" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-gray-900">{it.name ?? it.partNo}</div>
                        <div className="mt-1 text-sm text-gray-600">
                          Part: <span className="font-semibold text-gray-800">{it.partNo}</span>
                          {it.subcategory ? (
                            <>
                              {" • "}
                              Subcategory:{" "}
                              <span className="font-semibold text-gray-800">{it.subcategory}</span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-600">Price</div>
                        <div className="text-sm font-semibold text-gray-900">{formatMoney(it.price)}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-gray-900">Qty</div>

                        <div className="inline-flex items-center rounded-md border border-slate-300 bg-white">
                          <button
                            type="button"
                            onClick={() => dec(it.partNo, it.qty)}
                            className="h-9 w-9 text-lg font-semibold text-gray-900 hover:bg-slate-50 disabled:opacity-50"
                            disabled={isBusy}
                          >
                            −
                          </button>

                          <input
                            type="number"
                            min={1}
                            value={it.qty}
                            onChange={(e) => setQty(it.partNo, Math.max(1, Number(e.target.value || 1)))}
                            className="h-9 w-14 border-x border-slate-300 text-center text-sm font-semibold text-gray-900 outline-none disabled:opacity-50"
                            disabled={isBusy}
                          />

                          <button
                            type="button"
                            onClick={() => inc(it.partNo, it.qty)}
                            className="h-9 w-9 text-lg font-semibold text-gray-900 hover:bg-slate-50 disabled:opacity-50"
                            disabled={isBusy}
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => onRemove(it.partNo)}
                          className="text-sm font-semibold text-gray-900 hover:underline disabled:opacity-50"
                          disabled={isBusy}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-600">Line total</div>
                        <div className="text-base font-bold text-gray-900">
                          {formatMoney(Number(it.lineTotal || 0))}
                        </div>
                      </div>
                    </div>

                    {loading && <div className="mt-3 text-xs text-gray-500">Updating totals…</div>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* RIGHT: summary */}
      <aside className="h-fit rounded-2xl border border-slate-300 bg-slate-100 p-6 shadow-sm lg:sticky lg:top-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-300 pb-4">
          <div className="text-4xl font-semibold tracking-tight text-gray-900">Order Summary</div>
          <div className="text-lg font-semibold text-gray-900">{formatMoney(total)}</div>
        </div>
        <p className="mt-3 text-sm text-gray-600">Taxes/shipping are estimates until you place the order.</p>

        <div className="mt-4 space-y-4 border-t border-slate-300 pt-4">
          {effectiveLineItems.map((it) => (
            <div key={`${it.partNo}-summary`} className="flex items-start justify-between gap-3 border-b border-slate-300 pb-4">
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-md bg-white">
                  <Image src={it.image || "/products/alignment-coupler.png"} alt={it.partNo} fill className="object-contain p-1" sizes="56px" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{it.name ?? it.partNo}</div>
                  <div className="text-xs text-gray-600">{it.partNo}</div>
                  <div className="mt-1 text-xs text-gray-700">x{it.qty}</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-900">{formatMoney(Number(it.lineTotal || 0))}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Subtotal</span>
            <span className="font-semibold text-gray-900">{formatMoney(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-700">Shipping</span>
            <span className="font-semibold text-gray-900">
              {shipping > 0 ? formatMoney(shipping) : "Calculated at next step"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-700">Tax</span>
            <span className="font-semibold text-gray-900">{formatMoney(tax)}</span>
          </div>

          <div className="my-3 border-t border-slate-300" />

          <div className="flex items-center justify-between">
            <span className="text-gray-700">Total</span>
            <span className="text-xl font-bold text-gray-900">{formatMoney(total)}</span>
          </div>
        </div>

        {/* This goes to app/place-order/page.tsx */}
        <Link
          href="/place-order"
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Continue to Shipping
        </Link>

        <div className="mt-4 rounded-xl border border-slate-300 bg-white p-3 text-xs text-gray-700">
          <div className="font-semibold text-gray-900">Shipping notice</div>
          <div className="mt-1">
            We currently ship only to <span className="font-semibold">USA</span> and{" "}
            <span className="font-semibold">Canada</span>.
          </div>
        </div>

        <Link
          href="/products"
          className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-slate-50"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
