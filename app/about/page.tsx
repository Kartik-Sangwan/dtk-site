import Image from "next/image";
import Link from "next/link";

const images = {
  hero: "/images/site/about-hero.jpg",
  cnc: "/images/site/about-cnc.jpg",
  quality: "/images/site/about-quality.jpg",
  teamwork: "/images/site/about-team.jpg",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="industrial-panel overflow-hidden rounded-2xl">
          <div className="relative h-72 w-full md:h-96">
            <Image src={images.hero} alt="Industrial machining environment" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-900/30" />
            <div className="absolute bottom-0 left-0 p-7 md:p-10">
              <h1 className="max-w-3xl text-4xl font-black text-white md:text-5xl">
                About DTK Industrial Components
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-100 md:text-base">
                Built around industrial reliability, dimensional consistency, and responsive support
                for fluid power customers.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-slate-300 bg-white p-6">
            <h2 className="text-2xl font-bold text-[var(--steel-900)]">What We Do</h2>
            <p className="mt-3 text-[var(--muted)]">
              DTK Industrial Components manufactures and supplies NFPA and ISO-compatible cylinder
              accessories including mounts, clevises, rod eyes, trunnions, pivot pins, and hardware.
              We support both standard catalog sourcing and practical equivalent solutions when you
              need a replacement path.
            </p>

            <h3 className="mt-7 text-xl font-bold text-[var(--steel-900)]">How We Work</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
              <li>Specification-first review on dimensions, thread, and load context.</li>
              <li>Controlled machining and repeatable finishing process.</li>
              <li>Inspection checkpoints before pack and release.</li>
              <li>Fast communication for quote, cross-reference, and order status.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-300 bg-white p-6">
            <h2 className="text-2xl font-bold text-[var(--steel-900)]">Mission</h2>
            <p className="mt-3 text-[var(--muted)]">
              Deliver quality accessories on time at competitive pricing, while keeping service
              practical and technical.
            </p>
            <div className="mt-6 rounded-xl border border-slate-300 bg-[var(--surface-alt)] p-4">
              <div className="text-sm font-semibold text-[var(--steel-900)]">Core Priorities</div>
              <div className="mt-2 grid gap-2 text-sm text-[var(--muted)]">
                <div>Reliability in repetitive industrial duty</div>
                <div>Dimensional consistency and interchangeability</div>
                <div>Straightforward customer support</div>
              </div>
            </div>
            <Link
              href="/resources/process"
              className="mt-6 inline-flex rounded-md bg-[var(--steel-900)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--steel-700)]"
            >
              View Process Overview
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            [images.cnc, "Machining", "Controlled CNC operations and dimension-focused setup."],
            [images.quality, "Inspection", "Visual and dimensional checks before shipment."],
            [images.teamwork, "Support", "Engineering-oriented collaboration with customer teams."],
          ].map(([src, title, desc]) => (
            <div key={title} className="overflow-hidden rounded-xl border border-slate-300 bg-white">
              <div className="relative h-52 w-full">
                <Image src={src} alt={title} fill className="object-cover" />
              </div>
              <div className="p-4">
                <div className="text-lg font-bold text-[var(--steel-900)]">{title}</div>
                <div className="mt-1 text-sm text-[var(--muted)]">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
