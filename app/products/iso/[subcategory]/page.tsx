import Link from "next/link";
import { notFound } from "next/navigation";
import ProductTableClient from "@/components/ProductTableClient";
import SubcategoryCarousel from "@/components/SubcategoryCarousel";
import { findInventoryRowsByPartNos } from "@/lib/inventory";

const isoSubs = [
  { slug: "iso-1", name: "ISO Type 1 Mounts" },
  { slug: "iso-2", name: "ISO Type 2 Mounts" },
  { slug: "iso-3", name: "ISO Type 3 Mounts" },
  { slug: "iso-4", name: "ISO Type 4 Mounts" },
];

// Dummy ISO parts data
const isoPartsBySlug: Record<string, { partNo: string; image?: string }[]> = {
  "iso-1": [
    { partNo: "ISO1-100", image: "/hero/part1.png" },
    { partNo: "ISO1-125", image: "/hero/part2.png" },
    { partNo: "ISO1-160", image: "/hero/part3.png" },
  ],
  "iso-2": [
    { partNo: "ISO2-100", image: "/hero/part1.png" },
    { partNo: "ISO2-125", image: "/hero/part2.png" },
    { partNo: "ISO2-160", image: "/hero/part3.png" },
  ],
  "iso-3": [
    { partNo: "ISO3-80", image: "/hero/part3.png" },
    { partNo: "ISO3-100", image: "/hero/part1.png" },
    { partNo: "ISO3-125", image: "/hero/part2.png" },
  ],
  "iso-4": [
    { partNo: "ISO4-63", image: "/hero/part2.png" },
    { partNo: "ISO4-80", image: "/hero/part3.png" },
  ],
};

export default async function IsoSubcategoryPage({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}) {
  const { subcategory } = await params;

  const sub = isoSubs.find((x) => x.slug === subcategory);
  if (!sub) notFound();

  const parts = isoPartsBySlug[subcategory] ?? [];
  const carouselImages = [1, 2, 3].map(
    (i) => `/images/subcategories/iso/${subcategory}-${i}.jpg`
  );
  const inventoryRows = await findInventoryRowsByPartNos(parts.map((p) => p.partNo));
  const priceByPartNo: Record<string, number> = {};
  for (const part of parts) {
    const row = inventoryRows[part.partNo];
    if (row) priceByPartNo[part.partNo] = row.price;
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-baseline justify-between gap-6">
          <div>
            <div className="text-sm text-gray-600">Products / ISO Mounts</div>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              ISO Mounts <span className="text-gray-400">→</span> {sub.name}
            </h1>
          </div>

          <Link href="/products/iso" className="text-sm font-semibold hover:underline">
            ← ISO categories
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="px-2 pb-2 text-sm font-semibold text-gray-900">
              ISO Subcategories
            </div>

            <nav className="mt-2 space-y-1">
              {isoSubs.map((s) => {
                const active = s.slug === subcategory;
                return (
                  <Link
                    key={s.slug}
                    href={`/products/iso/${s.slug}`}
                    className={[
                      "block rounded-lg px-3 py-2 text-sm",
                      active
                        ? "bg-slate-100 text-gray-900 font-semibold"
                        : "text-gray-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {s.name}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Parts table */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <SubcategoryCarousel images={carouselImages} title={sub.name} />
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Parts</h2>
              <div className="text-sm text-gray-600">{parts.length} part(s)</div>
            </div>

            <div className="mt-4">
              <ProductTableClient
                parts={parts}
                subcategory={subcategory}
                priceByPartNo={priceByPartNo}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
