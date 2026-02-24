"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type Part = { partNo: string; image?: string };

export default function ProductTableClient({
  parts,
  subcategory,
  priceByPartNo = {},
}: {
  parts: Part[];
  subcategory: string;
  priceByPartNo?: Record<string, number>;
}) {
  const [quote, setQuote] = useState<string[]>([]);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");

  const quoteCount = useMemo(() => quote.length, [quote]);

  function addToQuote(partNo: string) {
    setQuote((q) => (q.includes(partNo) ? q : [...q, partNo]));
  }

  function removeFromQuote(partNo: string) {
    setQuote((q) => q.filter((x) => x !== partNo));
  }

  function money(v: number) {
    return v.toLocaleString(undefined, { style: "currency", currency: "CAD" });
  }

  return (
    <>
      {/* Quote summary */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50 p-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Quote List</div>
          <div className="text-sm text-gray-700">
            {quoteCount
              ? `${quoteCount} part(s) selected`
              : "Add parts to request a quote."}
          </div>
        </div>

        <a
          href="/contact"
          className={[
            "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold",
            quoteCount === 0
              ? "pointer-events-none bg-gray-200 text-gray-500"
              : "bg-gray-900 text-white hover:bg-gray-800",
          ].join(" ")}
        >
          Request Quote
        </a>
      </div>

      {quoteCount > 0 && (
        <div className="mb-6 rounded-xl border border-slate-200/70 bg-white p-3">
          <div className="text-sm font-semibold text-gray-900">Selected</div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {quote.map((p) => (
              <li
                key={p}
                className="flex items-center gap-2 rounded-full border bg-slate-50 px-3 py-1 text-sm"
              >
                <span className="font-semibold text-gray-900">{p}</span>
                <button
                  onClick={() => removeFromQuote(p)}
                  className="text-gray-600 hover:text-gray-900"
                  aria-label={`Remove ${p}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-4 py-3 font-semibold">Product Number</th>
              <th className="px-4 py-3 font-semibold">View Image</th>
              <th className="px-4 py-3 font-semibold">Price (CAD)</th>
              <th className="px-4 py-3 font-semibold">View Stock</th>
              <th className="px-4 py-3 font-semibold">Add to Quote</th>
              <th className="px-4 py-3 font-semibold">Buy</th>
            </tr>
          </thead>

          <tbody>
            {parts.map((p) => (
              <tr key={p.partNo} className="border-b border-slate-200">
                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                  {p.partNo}
                </td>

                <td className="px-4 py-3">
                  {p.image ? (
                    <button
                      className="font-semibold text-blue-700 hover:underline"
                      onClick={() => {
                        setModalImg(p.image!);
                        setModalTitle(p.partNo);
                      }}
                    >
                      View Image
                    </button>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>

                <td className="px-4 py-3 text-gray-900 font-semibold whitespace-nowrap">
                  {typeof priceByPartNo[p.partNo] === "number" ? money(priceByPartNo[p.partNo]) : "—"}
                </td>

                <td className="px-4 py-3 text-gray-700">Contact for stock</td>

                <td className="px-4 py-3">
                  <button
                    onClick={() => addToQuote(p.partNo)}
                    className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                  >
                    Add
                  </button>
                </td>

                <td className="px-4 py-3">
                  <Link
                    href={`/products/nfpa/${subcategory}/${encodeURIComponent(
                      p.partNo
                    )}`}
                    className="inline-flex items-center rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-800"
                  >
                    Buy
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalImg && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModalImg(null)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                {modalTitle}
              </div>
              <button
                className="rounded-md px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-slate-100"
                onClick={() => setModalImg(null)}
              >
                Close
              </button>
            </div>

            <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-50">
              <Image
                src={modalImg}
                alt={modalTitle}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 900px"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
