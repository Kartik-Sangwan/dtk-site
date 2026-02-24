"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { notifyCartUpdated } from "@/lib/cart-client";

export default function AddToCartCard({ product }: { product: Product }) {
  const [qty, setQty] = useState<number>(1);
  const [addedMsg, setAddedMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const inStockLabel = useMemo(() => {
    if (product.stock <= 0) return "Out of stock";
    if (product.stock <= 5) return `Low stock (${product.stock})`;
    return `${product.stock} in stock`;
  }, [product.stock]);

  const leadTimeLabel = useMemo(() => {
    if (product.stock <= 0) return "Lead time: currently unavailable. Request quote for delivery timeline.";
    if (product.stock <= 5) return "Lead time: low inventory, estimated 2-4 business days.";
    return "Lead time: in stock, estimated 1-2 business days.";
  }, [product.stock]);

  async function onAdd() {
    if (product.stock <= 0) return;

    setBusy(true);
    setAddedMsg("");

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "add",
          partNo: product.partNo,
          qty,
          // optional for future: subcategory: product.subcategory
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      // ✅ update header badge + any listeners
      notifyCartUpdated();

      setAddedMsg(`Added ${qty} to cart ✅`);
      // Optional: reset qty back to 1
      // setQty(1);
    } catch (e: unknown) {
      setAddedMsg(e instanceof Error ? e.message : "Failed to add to cart");
    } finally {
      setBusy(false);
      // auto-clear message
      window.setTimeout(() => setAddedMsg(""), 2000);
    }
  }

  return (
    <aside className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold text-gray-900">Purchase</div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm text-gray-700">Price</div>
        <div className="mt-1 text-3xl font-bold text-gray-900">
          ${product.price.toFixed(2)}
        </div>

        <div className="mt-2 text-sm font-semibold text-gray-900">{inStockLabel}</div>
        <div className="mt-1 text-xs text-gray-600">{leadTimeLabel}</div>

        <div className="mt-4 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Unit of measure</span>
            <span className="font-semibold text-gray-900">Each (EA)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Minimum order</span>
            <span className="font-semibold text-gray-900">1</span>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold text-gray-900">Quantity</label>
          <div className="mt-2 flex items-center gap-2">
            <button
              className="h-10 w-10 rounded-md border border-slate-300 bg-white text-lg font-semibold text-gray-900 hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              disabled={busy}
            >
              −
            </button>

            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
              className="h-10 w-24 rounded-md border border-slate-300 bg-white px-3 text-center text-sm font-semibold text-gray-900 outline-none focus:border-slate-500 disabled:opacity-50"
              disabled={busy}
            />

            <button
              className="h-10 w-10 rounded-md border border-slate-300 bg-white text-lg font-semibold text-gray-900 hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setQty((q) => q + 1)}
              aria-label="Increase quantity"
              disabled={busy}
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={onAdd}
          disabled={product.stock <= 0 || busy}
          className={[
            "mt-4 w-full rounded-md px-4 py-3 text-sm font-semibold",
            product.stock <= 0 || busy
              ? "cursor-not-allowed bg-gray-200 text-gray-500"
              : "bg-gray-900 text-white hover:bg-gray-800",
          ].join(" ")}
        >
          {busy ? "Adding..." : "Add to Cart"}
        </button>

        <Link
          href={`/contact?partNo=${encodeURIComponent(product.partNo)}`}
          className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-slate-50"
        >
          Request Quote
        </Link>

        {addedMsg && <div className="mt-3 text-sm font-semibold text-gray-900">{addedMsg}</div>}
      </div>
    </aside>
  );
}
