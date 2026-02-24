import Image from "next/image";
import Link from "next/link";

export default function CrossReferencePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
          <div className="relative h-64 w-full md:h-80">
            <Image
              src="/images/site/cross-hero.jpg"
              alt="Engineering drawings and documentation"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/45" />
            <div className="absolute bottom-0 left-0 p-7">
              <h1 className="text-4xl font-black text-white">Cross-Reference Workflow</h1>
              <p className="mt-2 text-sm text-slate-100">
                Evaluate equivalents when replacing legacy or competitor parts.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-300 bg-white p-6">
          <h2 className="text-xl font-bold text-[var(--steel-900)]">What to Provide</h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-[var(--muted)] space-y-2">
            <li>Current part number and known equivalent candidates</li>
            <li>Critical dimensions: thread, bore/pin, center distances</li>
            <li>Load expectations and movement type</li>
            <li>Material or coating constraints</li>
            <li>Required quantity and target lead time</li>
          </ul>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            [
              "1. Compare Geometry",
              "Confirm form-fit compatibility against drawing callouts.",
              "/images/site/cross-1.jpg",
            ],
            [
              "2. Check Load Context",
              "Validate pull/compression and side-load considerations.",
              "/images/site/cross-2.jpg",
            ],
            [
              "3. Confirm Supply Plan",
              "Lock commercial terms, lead time, and stocking strategy.",
              "/images/site/cross-3.jpg",
            ],
          ].map(([title, desc, img]) => (
            <div key={title} className="rounded-xl border border-slate-300 bg-[var(--surface-alt)] p-4">
              <div className="relative mb-3 h-32 w-full overflow-hidden rounded-lg">
                <Image src={img} alt={title} fill className="object-cover" />
              </div>
              <div className="font-bold text-[var(--steel-900)]">{title}</div>
              <div className="mt-2 text-sm text-[var(--muted)]">{desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/contact" className="text-sm font-semibold text-[var(--steel-900)] hover:underline">
            Submit a cross-reference request →
          </Link>
        </div>
      </section>
    </main>
  );
}
