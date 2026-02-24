import Image from "next/image";
import Link from "next/link";
import HeroCarousel from "../components/main_carousel";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="border-y border-slate-300 bg-slate-900 text-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-3 text-xs font-semibold tracking-[0.12em] uppercase">
          NFPA + ISO CYLINDER ACCESSORIES | Engineered for repetitive duty cycles
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="industrial-panel industrial-grid-bg overflow-hidden rounded-2xl p-6 md:p-8">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <span className="industrial-badge">Production Ready Supply</span>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--steel-900)] md:text-5xl">
                Industrial Mounting Hardware For Hydraulic and Pneumatic Cylinders
              </h1>
              <p className="mt-4 max-w-2xl text-base text-[var(--muted)] md:text-lg">
                Source NFPA and ISO mounts, clevises, rod eyes, trunnions, and pins with
                consistent specs, clear lead-time communication, and practical engineering support.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="inline-flex rounded-md bg-[var(--steel-900)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--steel-700)]"
                  href="/products"
                >
                  Browse Product Families
                </Link>
                <Link
                  className="inline-flex rounded-md border border-slate-400 bg-white px-5 py-3 text-sm font-semibold text-[var(--steel-900)] hover:bg-slate-50"
                  href="/resources"
                >
                  Explore Technical Resources
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                {[
                  ["Vertical Integration", "Machining to final pack"],
                  ["Quality Control", "Dimensional checks by lot"],
                  ["Cross-Reference Help", "Equivalent part support"],
                  ["Responsive Quoting", "Industrial buyer focused"],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-lg border border-slate-300 bg-white/80 p-3">
                    <div className="font-semibold text-[var(--steel-900)]">{title}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full">
              <HeroCarousel />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="rounded-2xl border border-slate-300 bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[var(--steel-900)]">Process and Quality</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                A clear process for repeatability, delivery confidence, and field reliability.
              </p>
            </div>
            <Link href="/resources/process" className="text-sm font-semibold text-[var(--steel-900)] hover:underline">
              See process page →
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ["/images/site/home-process-1.jpg", "CNC machining cell"],
              ["/images/site/home-process-2.jpg", "Quality check station"],
            ].map(([src, alt]) => (
              <div key={alt} className="overflow-hidden rounded-xl border border-slate-300">
                <div className="relative h-48 w-full">
                  <Image src={src} alt={alt} fill className="object-cover" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {[
              ["01", "Raw Material", "Controlled material intake and trace records."],
              ["02", "Machining", "Thread, bore, and face dimensions held to print."],
              ["03", "Finishing", "Deburr, clean, coat, and corrosion-conscious prep."],
              ["04", "Inspection", "Critical dimension checks + visual QA gate."],
              ["05", "Pack & Ship", "Labeled, protected, and ready for receiving teams."],
            ].map(([step, title, desc]) => (
              <div key={step} className="rounded-xl border border-slate-300 bg-[var(--surface-alt)] p-4">
                <div className="text-xs font-bold tracking-wider text-[var(--steel-500)]">{step}</div>
                <div className="mt-2 text-base font-semibold text-[var(--steel-900)]">{title}</div>
                <div className="mt-1 text-sm text-[var(--muted)]">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--steel-900)]">Use Cases by Industry</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Start from your operating context and narrow to the right mounting families.
            </p>
          </div>
          <Link className="text-sm font-semibold text-[var(--steel-900)] hover:underline" href="/products">
            View all products →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["General Manufacturing", "High-cycle fixture and automation cylinders.", "/products/nfpa"],
            ["Mobile Hydraulics", "Vibration-tolerant mounting accessories.", "/products/nfpa/rod-clevis"],
            ["Food & Packaging", "Fast replacement and reduced downtime focus.", "/products/nfpa/eye-brackets"],
            ["Repair & MRO", "Cross-reference and quick-ship replacement parts.", "/resources/cross-reference"],
          ].map(([title, desc, href]) => (
            <Link key={title} href={href} className="industrial-panel group rounded-xl p-5 hover:border-slate-400">
              <div className="text-base font-bold text-[var(--steel-900)]">{title}</div>
              <div className="mt-2 text-sm text-[var(--muted)]">{desc}</div>
              <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--steel-500)] group-hover:text-[var(--steel-900)]">
                Explore →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
