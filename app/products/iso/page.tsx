import Link from "next/link";

export default function IsoPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h1 className="text-3xl font-bold text-gray-900">ISO Mounts</h1>
        <p className="mt-3 text-lg text-gray-700">
          ISO-compatible cylinder mounts and accessories.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/products/iso/iso-1"
            className="rounded-xl border bg-white p-5 shadow-sm hover:bg-slate-50"
          >
            ISO Type 1
          </Link>
          <Link
            href="/products/iso/iso-2"
            className="rounded-xl border bg-white p-5 shadow-sm hover:bg-slate-50"
          >
            ISO Type 2
          </Link>
          <Link
            href="/products/iso/iso-3"
            className="rounded-xl border bg-white p-5 shadow-sm hover:bg-slate-50"
          >
            ISO Type 3
          </Link>
        </div>
      </section>
    </main>
  );
}
