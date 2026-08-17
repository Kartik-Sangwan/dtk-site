import Image from "next/image";
import Link from "next/link";
import { siteImages } from "@/lib/site-images";

export default function MountingSelectionPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
          <div className="relative h-64 w-full md:h-80">
            <Image
              src={siteImages.resources.mountingHero}
              alt="Hydraulic mounting hardware grouped by application"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/45" />
            <div className="absolute bottom-0 left-0 p-7">
              <h1 className="text-4xl font-black text-white">Mounting Selection Guide</h1>
              <p className="mt-2 text-sm text-slate-100">
                Use this quick path to pick the right cylinder accessory family for your application.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            [
              "Inline Force",
              "Rod eye, rod clevis, and alignment coupler options.",
              "/images/site/generated/mount-inline-force-v2.png",
            ],
            [
              "Pivotted Motion",
              "Clevis brackets, eye brackets, and pivot pins.",
              "/images/site/generated/mount-pivotted-motion-v2.png",
            ],
            [
              "Fixed End Mounting",
              "Rectangular flanges and detachable mounts.",
              "/images/site/mount-3.jpg",
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
          <h2 className="text-xl font-bold text-[var(--steel-900)]">Selection Checklist</h2>
          <ol className="mt-3 list-decimal pl-5 text-sm text-[var(--muted)] space-y-2">
            <li>Confirm pin size, thread size, and bore compatibility.</li>
            <li>Identify load direction and expected side-load risk.</li>
            <li>Decide between standard mount vs spherical/self-aligning style.</li>
            <li>Verify environment: washdown, corrosion, contamination, heat.</li>
            <li>Validate installation envelope and maintenance access.</li>
          </ol>
        </div>

        <div className="mt-8">
          <Link href="/products/nfpa" className="text-sm font-semibold text-[var(--steel-900)] hover:underline">
            Browse NFPA families →
          </Link>
        </div>
      </section>
    </main>
  );
}
