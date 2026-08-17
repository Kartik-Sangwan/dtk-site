import Link from "next/link";

export default function IsoPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="max-w-3xl rounded-2xl border border-slate-300 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">ISO Mounts</h1>
          <p className="mt-3 text-lg text-gray-700">
            ISO mount requirements are handled on a customer basis for applications that need
            specific fit, dimensional review, or equivalent sourcing support.
          </p>
          <p className="mt-4 text-sm text-gray-600">
            Share your current part number, drawing, key dimensions, or load context and our team
            can review the request and guide the next step.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex rounded-md bg-[var(--steel-900)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--steel-700)]"
            >
              Contact Us
            </Link>
            <Link
              href="/contact?partNo=ISO"
              className="inline-flex rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[var(--steel-900)] hover:bg-slate-50"
            >
              Request a Quote
            </Link>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Typical inputs: mounting style, thread details, pin size, center distances, material
            preferences, and target quantity.
          </div>
        </div>
      </section>
    </main>
  );
}
