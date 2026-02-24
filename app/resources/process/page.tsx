import Image from "next/image";

const processImages = [
  {
    src: "/images/site/proc-1.jpg",
    title: "Machining Setup",
    desc: "Fixture setup and tool-path preparation before production runs.",
  },
  {
    src: "/images/site/proc-2.jpg",
    title: "In-Process Checks",
    desc: "Operator and inspector verification at defined process checkpoints.",
  },
  {
    src: "/images/site/proc-3.jpg",
    title: "CNC Operations",
    desc: "Thread, bore, and profile machining for mount and hardware families.",
  },
];

export default function ProcessPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
          <div className="relative h-64 w-full md:h-80">
            <Image
              src="/images/site/proc-hero.jpg"
              alt="Manufacturing process overview"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/45" />
            <div className="absolute bottom-0 left-0 p-7">
              <h1 className="text-4xl font-black text-white">Manufacturing Process</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-100">
                A simplified view of how parts move from machining through quality checks into shipment.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {processImages.map((img) => (
            <div key={img.title} className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
              <div className="relative h-56 w-full">
                <Image src={img.src} alt={img.title} fill className="object-cover" />
              </div>
              <div className="p-4">
                <div className="text-lg font-bold text-[var(--steel-900)]">{img.title}</div>
                <div className="mt-1 text-sm text-[var(--muted)]">{img.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-300 bg-white p-6">
          <h2 className="text-xl font-bold text-[var(--steel-900)]">Process Flow</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
            <li>Material intake and lot identification</li>
            <li>Machining and thread/profile operations</li>
            <li>Deburr and finishing preparation</li>
            <li>Dimensional and visual inspection checkpoints</li>
            <li>Packing, labeling, and shipment release</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
