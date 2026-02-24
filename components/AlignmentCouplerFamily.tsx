"use client";

import ProductImageCarousel from "@/components/ProductImageCarousel";
import { useMemo, useState } from "react";
import { alignmentCouplers } from "@/lib/alignmentCoupler";

import Link from "next/link";

function money(v: number) {
  return v.toLocaleString(undefined, { style: "currency", currency: "CAD" });
}

export default function AlignmentCouplerFamily({
  subcategory,
  priceByPartNo = {},
}: {
  subcategory: string;
  priceByPartNo?: Record<string, number>;
}) {
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const baseRows = alignmentCouplers.filter((r) => Object.prototype.hasOwnProperty.call(priceByPartNo, r.part));
    if (!s) return baseRows;
    return baseRows.filter((r) => r.part.toLowerCase().includes(s));
  }, [q, priceByPartNo]);

  return (
    <section className="w-full">
      {/* Top card */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alignment Coupler</h1>
            <p className="mt-3 text-gray-700">
              Steel alignment couplers. Find a part number below to view dimensions and pull rating.
            </p>

            <div className="mt-6">
              <label className="text-sm font-semibold text-gray-900">Search part number</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='Try "DAC-1000"'
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
              />
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{rows.length}</span> parts
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Pricing source: inventory.csv
            </div>
          </div>

          {/* shared product image */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <ProductImageCarousel
                images={[1, 2, 3].map((i) => `/images/subcategories/nfpa/${subcategory}-${i}.jpg`)}
              />

            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Material: Steel</div>
              <a
                href="/specs/alignment-coupler-diagram.png"
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

                    <th className="px-4 py-3 font-semibold text-gray-900">
                    Part #
                    </th>

                    {/* A */}
                    <th className="px-4 py-3 font-semibold text-gray-900">
                    <div className="group relative inline-block cursor-help">
                        A
                        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Thread size
                        </div>
                    </div>
                    </th>

                    {/* B */}
                    <th className="px-4 py-3 font-semibold text-gray-900">
                    <div className="group relative inline-block cursor-help">
                        B
                        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Body diameter
                        </div>
                    </div>
                    </th>

                    {/* C */}
                    <th className="px-4 py-3 font-semibold text-gray-900">
                    <div className="group relative inline-block cursor-help">
                        C
                        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Overall body length
                        </div>
                    </div>
                    </th>

                    {/* D */}
                    <th className="px-4 py-3 font-semibold text-gray-900">
                    <div className="group relative inline-block cursor-help">
                        D
                        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Shoulder thickness
                        </div>
                    </div>
                    </th>

                    {/* E */}
                    <th className="px-4 py-3 font-semibold text-gray-900">
                    <div className="group relative inline-block cursor-help">
                        E
                        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Shank length
                        </div>
                    </div>
                    </th>

                    {/* F */}
                    <th className="px-4 py-3 font-semibold text-gray-900">
                    <div className="group relative inline-block cursor-help">
                        F
                        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Shank diameter
                        </div>
                    </div>
                    </th>

                    {/* O */}
                    <th className="px-4 py-3 font-semibold text-gray-900">
                    <div className="group relative inline-block cursor-help">
                        O
                        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Bore diameter
                        </div>
                    </div>
                    </th>

                    {/* H */}
                    <th className="px-4 py-3 font-semibold text-gray-900">
                    <div className="group relative inline-block cursor-help">
                        H
                        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Hex across flats
                        </div>
                    </div>
                    </th>

                    {/* Max Pull */}
                    <th className="px-4 py-3 font-semibold text-gray-900">
                    <div className="group relative inline-block cursor-help">
                        Max Pull
                        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Maximum tensile load at yield (lbs)
                        </div>
                    </div>
                    </th>
                <th className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">Price</th>

                
                <th className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">Buy</th></tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.part} className="border-b border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-gray-900">{r.part}</td>
                  <td className="px-4 py-3 text-gray-800">{r.A}</td>
                  <td className="px-4 py-3 text-gray-800">{r.B}</td>
                  <td className="px-4 py-3 text-gray-800">{r.C}</td>
                  <td className="px-4 py-3 text-gray-800">{r.D}</td>
                  <td className="px-4 py-3 text-gray-800">{r.E}</td>
                  <td className="px-4 py-3 text-gray-800">{r.F}</td>
                  <td className="px-4 py-3 text-gray-800">{r.O}</td>
                  <td className="px-4 py-3 text-gray-800">{r.H}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {r.maxPullAtYield.toLocaleString()} lb
                  </td>
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
            </tbody>
          </table>
        </div>

        {/* Dimensions Legend */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-gray-900">
                Dimension Legend
            </div>

            <div className="mt-3 grid gap-2 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-3">
                <div><strong>A</strong> — Thread size</div>
                <div><strong>B</strong> — Body diameter</div>
                <div><strong>C</strong> — Overall body length</div>
                <div><strong>D</strong> — Shoulder thickness</div>
                <div><strong>E</strong> — Shank length</div>
                <div><strong>F</strong> — Shank diameter</div>
                <div><strong>O</strong> — Bore diameter</div>
                <div><strong>H</strong> — Hex across flats</div>
                <div><strong>Max Pull @ Yield</strong> — Maximum tensile load (lbs)</div>
            </div>
        </div>

      </div>
    </section>
  );
}
