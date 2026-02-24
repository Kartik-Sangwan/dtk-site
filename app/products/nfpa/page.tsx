import Link from "next/link";

const nfpaSubs = [
  { slug: "alignment-coupler", name: "Alignment Coupler" },
  { slug: "clevis-brackets", name: "Clevis Brackets" },
  { slug: "eye-brackets", name: "Eye Brackets" },
  { slug: "intermediate-trunnion-mounts", name: "Intermediate Trunnion Mounts" },
  { slug: "mp1-detachable-mount", name: "MP1 Detachable Mount" },
  { slug: "mp2-detachable-mount", name: "MP2 Detachable Mount" },
  { slug: "mp4-detachable-mount", name: "MP4 Detachable Mount" },
  { slug: "pivot-pins-grooves", name: "Pivot Pins - Grooves" },
  { slug: "pivot-pins-holes", name: "Pivot Pins - Holes" },
  { slug: "rectangular-flange", name: "Rectangular Flange" },
  { slug: "rod-clevis", name: "Rod Clevis" },
  { slug: "rod-eye", name: "Rod Eye" },
  { slug: "spherical-clevis-bracket", name: "Spherical Clevis Bracket" },
  { slug: "spherical-rod-eye", name: "Spherical Rod Eye" },
];

export default function NfpaPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex items-baseline justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">NFPA Mounts</h1>
            <p className="mt-2 text-gray-700">
              Select a subcategory to view part numbers, images, and specs.
            </p>
          </div>

          <Link
            href="/products"
            className="text-sm font-semibold text-gray-900 hover:underline"
          >
            ← Back to Products
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nfpaSubs.map((s) => (
            <Link
              key={s.slug}
              href={`/products/nfpa/${s.slug}`}
              className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm hover:bg-slate-50"
            >
              <div className="font-semibold text-gray-900">{s.name}</div>
              <div className="mt-1 text-sm text-gray-600">View parts →</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
