import Image from "next/image";
import Link from "next/link";

export default function MaterialsFinishesPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
          <div className="relative h-64 w-full md:h-80">
            <Image
              src="/images/site/mat-hero.jpg"
              alt="Metal finishing and materials"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/45" />
            <div className="absolute bottom-0 left-0 p-7">
              <h1 className="text-4xl font-black text-white">Materials and Finishes</h1>
              <p className="mt-2 text-sm text-slate-100">
                Match mount material and finish to your operating environment.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            [
              "Cast Iron",
              "Good baseline for general industrial duty where cost and rigidity are priorities.",
              "/images/site/mat-1.jpg",
            ],
            [
              "Steel",
              "Preferred for higher shock/vibration and demanding mechanical loading profiles.",
              "/images/site/mat-2.jpg",
            ],
            [
              "Corrosion-Sensitive Setups",
              "Use protective finishing and verify exposure to cleaners, moisture, and salts.",
              "/images/site/mat-3.jpg",
            ],
          ].map(([title, desc, img]) => (
            <div key={title} className="rounded-xl border border-slate-300 bg-white p-5">
              <div className="relative mb-4 h-36 w-full overflow-hidden rounded-lg">
                <Image src={img} alt={title} fill className="object-cover" />
              </div>
              <div className="text-lg font-bold text-[var(--steel-900)]">{title}</div>
              <div className="mt-2 text-sm text-[var(--muted)]">{desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-300 bg-white p-6">
          <h2 className="text-xl font-bold text-[var(--steel-900)]">Quick Use-Case Matrix</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[680px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-left">
                  <th className="py-2 pr-4 font-semibold text-[var(--steel-900)]">Environment</th>
                  <th className="py-2 pr-4 font-semibold text-[var(--steel-900)]">Typical Material</th>
                  <th className="py-2 pr-4 font-semibold text-[var(--steel-900)]">Priority</th>
                </tr>
              </thead>
              <tbody className="text-[var(--muted)]">
                <tr className="border-b border-slate-200">
                  <td className="py-2 pr-4">General indoor manufacturing</td>
                  <td className="py-2 pr-4">Cast iron</td>
                  <td className="py-2 pr-4">Cost and repeatability</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2 pr-4">High vibration / impact</td>
                  <td className="py-2 pr-4">Steel</td>
                  <td className="py-2 pr-4">Mechanical robustness</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Corrosive or washdown-adjacent</td>
                  <td className="py-2 pr-4">Protected finish options</td>
                  <td className="py-2 pr-4">Surface life and maintenance intervals</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/contact" className="text-sm font-semibold text-[var(--steel-900)] hover:underline">
            Ask for material recommendation →
          </Link>
        </div>
      </section>
    </main>
  );
}
