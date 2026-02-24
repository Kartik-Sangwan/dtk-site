"use client";

import ProductImageCarousel from "@/components/ProductImageCarousel";
import { useMemo, useState } from "react";
import { intermediateTrunnionMounts } from "@/lib/intermediateTrunnionMounts";

import Link from "next/link";

function TipTh({ label, tip }: { label: string; tip: string }) {
  return (
    <th className="px-4 py-3 font-semibold text-gray-900">
      <div className="group relative inline-block cursor-help">
        {label}
        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          {tip}
        </div>
      </div>
    </th>
  );
}

function money(v: number) {
  return v.toLocaleString(undefined, { style: "currency", currency: "CAD" });
}

export default function IntermediateTrunnionMountFamily({ subcategory, priceByPartNo = {} }: { subcategory: string; priceByPartNo?: Record<string, number> }) {
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const baseRows = intermediateTrunnionMounts.filter((r) => Object.prototype.hasOwnProperty.call(priceByPartNo, r.part));
    if (!s) return baseRows;
    return baseRows.filter((r) =>
      r.part.toLowerCase().includes(s)
    );
  }, [q, priceByPartNo]);

  return (
    <section className="w-full">
      {/* Top card */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Intermediate Trunnion Mounts
            </h1>
            <p className="mt-3 text-gray-700">
              NFPA intermediate trunnion mounts. Steel construction, machined
              pintle sizes.
            </p>

            <div className="mt-6">
              <label className="text-sm font-semibold text-gray-900">
                Search part number
              </label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='Try "DITM-40"'
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
              />
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold text-gray-900">{rows.length}</span>{" "}
              parts
            </div>
          </div>

          {/* shared product image */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <ProductImageCarousel
                images={[1, 2, 3].map((i) => `/images/subcategories/nfpa/${subcategory}-${i}.jpg`)}
              />

            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Material: Steel
              </div>
              <a
                href="/specs/intermediate-trunnion-mount-diagram.png"
                target="_blank"
                className="text-sm font-semibold text-gray-900 underline decoration-slate-400 hover:decoration-slate-700"
              >
                Open spec sheet
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Specs table */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/90 backdrop-blur">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 font-semibold text-gray-900">Part #</th>
                <TipTh
                  label="Block Size"
                  tip="Overall block size (inches)"
                />
                <TipTh
                  label="Pintle Size"
                  tip="Pintle size as machined"
                />
              
                <th className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">Price (CAD)</th>
                <th className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">Buy</th></tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.part}
                  className="border-b border-slate-100 hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                    {r.part}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{r.blockSize}</td>
                  <td className="px-4 py-3 text-gray-800">{r.pintleSize}</td>
                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                  {typeof priceByPartNo[r.part] === "number" ? money(priceByPartNo[r.part]) : "—"}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <Link
                    href={`/products/nfpa/${subcategory}/${encodeURIComponent(r.part)}`}
                    className="inline-flex items-center rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-800"
                  >
                    Buy
                  </Link>
                </td></tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-600">
                    No parts found{q ? ` for “${q}”` : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-gray-900">
            Notes
          </div>
          <div className="mt-2 text-sm text-gray-700">
            Pintle sizes listed are <strong>as machined</strong>.  
            Custom sizes available upon request.
          </div>
        </div>
      </div>
    </section>
  );
}
