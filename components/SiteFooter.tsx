import Link from "next/link";
import {
  BUSINESS_ADDRESS,
  BUSINESS_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_E164,
} from "@/lib/business";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-3">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Company</div>
          <p className="mt-2 text-sm font-semibold text-slate-900">{BUSINESS_NAME}</p>
          <p className="mt-2 text-sm text-slate-600">
            {BUSINESS_ADDRESS.line1}
            <br />
            {BUSINESS_ADDRESS.city}, {BUSINESS_ADDRESS.province} {BUSINESS_ADDRESS.postalCode}
            <br />
            {BUSINESS_ADDRESS.country}
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Legal</div>
          <ul className="mt-2 space-y-2 text-sm">
            <li>
              <Link href="/shipping" className="text-slate-700 hover:text-slate-900 hover:underline">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link href="/returns" className="text-slate-700 hover:text-slate-900 hover:underline">
                Returns Policy
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-slate-700 hover:text-slate-900 hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-slate-700 hover:text-slate-900 hover:underline">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Contact</div>
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            <div>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-slate-900 hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </div>
            <div>
              <a href={`tel:${SUPPORT_PHONE_E164}`} className="hover:text-slate-900 hover:underline">
                {SUPPORT_PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
