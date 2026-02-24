// app/inventory/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type InventoryRow = {
  item: string;
  description: string;
  qtyOnHand: number;
  price: number;
  customerPartNo: string;
};

type InventoryResponse = {
  ok: boolean;
  privileged?: boolean;
  count?: number;
  items?: InventoryRow[];
  error?: string;
};

function money(n: number) {
  return `$${(Number(n) || 0).toFixed(2)}`;
}

export default function InventoryPage() {
  const [q, setQ] = useState("");
  const [field, setField] = useState<"any" | "item" | "customer" | "desc">("any");
  const [accessCode, setAccessCode] = useState("");
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [count, setCount] = useState<number>(0);
  const [privileged, setPrivileged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setLoading(true);
      setErr(null);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        params.set("field", field);

        const res = await fetch(`/api/inventory?${params.toString()}`, {
          cache: "no-store",
          headers: accessCode
            ? { "x-inventory-access-code": accessCode }
            : undefined,
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as InventoryResponse;
        if (cancelled) return;

        const nextPrivileged = !!data?.privileged;
        setPrivileged(nextPrivileged);
        if (!nextPrivileged && field === "customer") setField("any");

        setRows(Array.isArray(data?.items) ? data.items : []);
        setCount(Number(data?.count ?? 0));
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load inventory");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q, field, accessCode]);

  const inStock = useMemo(
    () => rows.filter((r) => (r.qtyOnHand ?? 0) > 0).length,
    [rows]
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden border-b border-slate-300 bg-slate-900">
        <div className="absolute inset-0">
          <Image
            src="/images/site/about-cnc.jpg"
            alt="CNC machining line"
            fill
            className="object-cover opacity-35"
            sizes="100vw"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/70 to-slate-900/35" />
        <div className="relative mx-auto max-w-7xl px-6 py-14">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Inventory</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
            Live stock visibility for cylinders and mounting accessories. Search by part number,
            description, or customer mapping when authorized.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Search Panel
            </p>
            <p className="text-xs text-slate-500">Showing up to 500 results.</p>
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-900">Search</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. 31961500 or Rod Eye"
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
              />
            </div>

            <div className="w-full md:w-64">
              <label className="text-sm font-semibold text-gray-900">Access Code (Customer Only)</label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter passphrase"
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
              />
            </div>

            <div className="w-full md:w-64">
              <label className="text-sm font-semibold text-gray-900">Field</label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value as "any" | "item" | "customer" | "desc")}
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
              >
                <option value="any">Any</option>
                <option value="item">Item #</option>
                {privileged && <option value="customer">Customer Part #</option>}
                <option value="desc">Description</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-700">
            {loading ? (
              "Loading…"
            ) : err ? (
              <span className="text-red-700">{err}</span>
            ) : (
              <>
                Matches: <span className="font-semibold">{count}</span> • In stock (in this view):{" "}
                <span className="font-semibold">{inStock}</span>
                {privileged ? (
                  <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                    Customer mode
                  </span>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 font-semibold text-gray-900">Item</th>
                  {privileged && (
                    <th className="px-4 py-3 font-semibold text-gray-900">Customer Part #</th>
                  )}
                  <th className="px-4 py-3 font-semibold text-gray-900">Description</th>
                  <th className="px-4 py-3 font-semibold text-gray-900 text-right">Qty On Hand</th>
                  <th className="px-4 py-3 font-semibold text-gray-900 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.item}-${r.customerPartNo}`} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-semibold text-gray-900">{r.item}</td>
                    {privileged && (
                      <td className="px-4 py-3 text-gray-700">{r.customerPartNo || "—"}</td>
                    )}
                    <td className="px-4 py-3 text-gray-700">{r.description}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={[
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                          (r.qtyOnHand ?? 0) > 0
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-slate-100 text-slate-700",
                        ].join(" ")}
                      >
                        {Number(r.qtyOnHand ?? 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {money(r.price)}
                    </td>
                  </tr>
                ))}

                {!loading && !err && rows.length === 0 && (
                  <tr>
                    <td className="px-4 py-10 text-center text-gray-600" colSpan={privileged ? 5 : 4}>
                      {privileged
                        ? "Enter Part Number, Description, or Customer Number in Search to view inventory."
                        : "Enter Part Number or Description in Search to view inventory."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
