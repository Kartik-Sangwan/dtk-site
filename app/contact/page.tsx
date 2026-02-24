import Image from "next/image";
import QuoteRequestForm from "@/components/QuoteRequestForm";
import {
  BUSINESS_ADDRESS,
  BUSINESS_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_E164,
} from "@/lib/business";

const contactImage = "/images/site/contact-hero.jpg";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ partNo?: string }>;
}) {
  const sp = await searchParams;
  const partNo = sp.partNo ? String(sp.partNo) : "";

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
            <div className="relative h-72 w-full md:h-96">
              <Image src={contactImage} alt="Industrial workshop and machinery" fill className="object-cover" />
              <div className="absolute inset-0 bg-slate-900/35" />
              <div className="absolute bottom-0 left-0 p-6">
                <h1 className="text-4xl font-black text-white">Contact Us</h1>
                <p className="mt-2 max-w-md text-sm text-slate-100">
                  Reach us for technical selection help, pricing, and cross-reference support.
                </p>
              </div>
            </div>
          </div>

          <div className="industrial-panel rounded-2xl p-6">
            <div className="text-lg font-bold text-[var(--steel-900)]">{BUSINESS_NAME}</div>
            <div className="mt-3 text-sm text-[var(--muted)]">
              {BUSINESS_ADDRESS.line1}
              <br />
              {BUSINESS_ADDRESS.city}, {BUSINESS_ADDRESS.province}, {BUSINESS_ADDRESS.country}
              <br />
              {BUSINESS_ADDRESS.postalCode}
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div>
                <span className="font-semibold text-[var(--steel-900)]">Phone: </span>
                <a href={`tel:${SUPPORT_PHONE_E164}`} className="text-[var(--steel-900)] underline">
                  {SUPPORT_PHONE_DISPLAY}
                </a>
              </div>
              <div>
                <span className="font-semibold text-[var(--steel-900)]">Email: </span>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[var(--steel-900)] underline">
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>

            <a
              href="https://www.google.com/maps/dir/?api=1&destination=20%20Lightbeam%20Ter%20%237%2C%20Brampton%2C%20ON%20L6Y%206H9"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center rounded-md bg-[var(--steel-900)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--steel-700)]"
            >
              View on Google Maps →
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Technical Selection", "Share bore, thread, and load context for faster matching."],
            ["Quote Support", "Get pricing and lead-time updates for production planning."],
            ["Cross-Reference", "Map current part numbers to DTK alternatives."],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-xl border border-slate-300 bg-white p-4">
              <div className="text-base font-bold text-[var(--steel-900)]">{title}</div>
              <div className="mt-1 text-sm text-[var(--muted)]">{desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <QuoteRequestForm initialPartNo={partNo} />
        </div>
      </section>
    </main>
  );
}
