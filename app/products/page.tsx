import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    title: "NFPA Mounts",
    description: "Standard NFPA cylinder mounts and accessories.",
    href: "/products/nfpa",
  },
  {
    title: "ISO Mounts",
    description: "ISO-compatible mounts and equivalents.",
    href: "/products/iso",
  },
];

export default function ProductsPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="industrial-panel overflow-hidden rounded-2xl">
          <div className="relative h-56 w-full md:h-72">
            <Image src="/images/site/products-hero.jpg" alt="Industrial components" fill className="object-cover" />
            <div className="absolute inset-0 bg-slate-900/40" />
            <div className="absolute bottom-0 left-0 p-7">
              <h1 className="text-4xl font-black text-white">Product Families</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-100">
                Browse by family, compare dimensions, and move quickly from selection to order.
              </p>
            </div>
          </div>
        </div>
        <div className="industrial-panel mt-4 rounded-2xl p-7">
          <h2 className="text-3xl font-black text-[var(--steel-900)]">Selection Overview</h2>
          <p className="mt-3 max-w-3xl text-base text-[var(--muted)]">
            Browse NFPA and ISO accessories by family, then drill into part-level dimensions and
            pricing. Use resources for mounting guidance and material selection if you are in
            discovery mode.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link
              href="/resources/mounting-selection"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 font-semibold text-[var(--steel-900)] hover:bg-slate-50"
            >
              Mounting Selection Guide
            </Link>
            <Link
              href="/resources/materials-finishes"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 font-semibold text-[var(--steel-900)] hover:bg-slate-50"
            >
              Material and Finish Guide
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm hover:bg-slate-50"
            >
              <div className="relative h-40 w-full">
                <Image
                  src={c.href === "/products/nfpa" ? "/images/site/products-cat-nfpa.jpg" : "/images/site/products-cat-iso.jpg"}
                  alt={c.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="text-xl font-bold text-[var(--steel-900)]">{c.title}</div>
                <div className="mt-2 text-[var(--muted)]">{c.description}</div>
                <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--steel-500)] group-hover:text-[var(--steel-900)]">
                  Browse family →
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-300 bg-white p-6">
          <h2 className="text-2xl font-bold text-[var(--steel-900)]">Use Cases by Industry</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Automation", "Repeat-cycle cylinder mounting in factory lines.", "/images/site/products-industry-1.jpg"],
              ["Mobile Equipment", "Durable mounting for shock and vibration.", "/images/site/products-industry-2.jpg"],
              ["Oil and Gas", "Heavy-duty support for hydraulic applications.", "/images/site/products-industry-3.jpg"],
              ["Maintenance Shops", "Quick replacement via cross-reference.", "/images/site/products-industry-4.jpg"],
            ].map(([title, desc, image]) => (
              <div key={title} className="rounded-xl border border-slate-300 bg-[var(--surface-alt)] p-4">
                <div className="relative mb-3 h-28 w-full overflow-hidden rounded-lg">
                  <Image src={image} alt={title} fill className="object-cover" />
                </div>
                <div className="text-base font-semibold text-[var(--steel-900)]">{title}</div>
                <div className="mt-1 text-sm text-[var(--muted)]">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
