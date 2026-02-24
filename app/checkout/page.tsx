// app/checkout/page.tsx
import CheckoutClient from "@/components/CheckoutClient";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-5xl font-semibold tracking-tight text-gray-900">Checkout</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">1 Cart</span>
            <span>›</span>
            <span>2 Shipping</span>
            <span>›</span>
            <span>3 Payment</span>
          </div>
          <p className="mt-3 text-sm text-gray-700">
            Shipping available to <span className="font-semibold">USA</span> and{" "}
            <span className="font-semibold">Canada</span> only.
          </p>
        </div>

        <CheckoutClient />
      </section>
    </main>
  );
}
