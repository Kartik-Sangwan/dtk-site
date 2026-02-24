import Image from "next/image";
import Link from "next/link";

const guides = [
  {
    title: "Manufacturing Process",
    desc: "See a simple visual walk-through from machining to quality checks and shipment.",
    href: "/resources/process",
    image: "/images/site/res-card-process.jpg",
  },
  {
    title: "Mounting Selection Guide",
    desc: "Choose mounting styles by load direction, alignment, and movement profile.",
    href: "/resources/mounting-selection",
    image: "/images/site/res-card-mounting.jpg",
  },
  {
    title: "Materials and Finishes",
    desc: "Quick rules for choosing cast iron, steel, and protective finish options.",
    href: "/resources/materials-finishes",
    image: "/images/site/res-card-materials.jpg",
  },
  {
    title: "Cross-Reference Workflow",
    desc: "A practical method to move from legacy part numbers to DTK equivalents.",
    href: "/resources/cross-reference",
    image: "/images/site/res-card-cross.jpg",
  },
];

export default function ResourcesPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="industrial-panel overflow-hidden rounded-2xl">
          <div className="relative h-64 w-full md:h-80">
            <Image
              src="/images/site/resources-hero.jpg"
              alt="Industrial manufacturing floor"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/45" />
            <div className="absolute bottom-0 left-0 p-7">
              <h1 className="text-4xl font-black text-white">Resources</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-100">
                Simple technical references built for buyers, maintenance teams, and engineers who
                need fast decisions.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {guides.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="group overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm hover:bg-slate-50"
            >
              <div className="relative h-44 w-full">
                <Image src={g.image} alt={g.title} fill className="object-cover" />
              </div>
              <div className="p-6">
                <div className="text-xl font-bold text-[var(--steel-900)]">{g.title}</div>
                <div className="mt-2 text-sm text-[var(--muted)]">{g.desc}</div>
                <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--steel-500)] group-hover:text-[var(--steel-900)]">
                  Open Guide →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
