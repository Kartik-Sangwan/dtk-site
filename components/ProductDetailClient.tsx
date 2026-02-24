"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/lib/catalog";

export default function ProductDetailClient({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  async function addToCart() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: product.name, qty }),
      });
      if (!res.ok) throw new Error("Add to cart failed");
      // optional: toast
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      {/* Left: carousel (simple for now) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain p-6"
            priority
          />
        </div>
      </div>

      {/* Right: purchase */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-sm text-gray-600">
          NFPA / {product.subcategory}
        </div>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          {product.name} <span className="text-gray-400">•</span> {product.name}
        </h1>

        <div className="mt-4 text-lg font-semibold text-gray-900">
          {product.price > 0 ? `$${(product.price / 100).toFixed(2)}` : "Call for price"}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-900">Qty</label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
            className="w-24 rounded-md border border-slate-300 bg-white px-3 py-2"
          />
        </div>

        <button
          onClick={addToCart}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add to cart"}
        </button>

        {/* Specs quick view */}
        {product.specsUrl ? (
          <div className="mt-8">
            <div className="text-sm font-semibold text-gray-900">Specs</div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md bg-slate-50 px-3 py-2">
                <div className="text-xs text-gray-600">Link</div>
                <a
                  href={product.specsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-gray-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-600"
                >
                  View specs
                </a>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
