import { BASE_SHIPPING_RATE } from "@/lib/business";

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Shipping Policy</h1>
        <div className="mt-6 space-y-4 rounded-2xl border border-slate-300 bg-white p-6 text-sm text-slate-700">
          <p>We currently ship to Canada and the United States.</p>
          <p>Standard shipping is calculated as {Math.round(BASE_SHIPPING_RATE * 100)}% of subtotal.</p>
          <p>Estimated delivery windows vary by destination, stock availability, and carrier performance.</p>
          <p>Tracking details are provided once orders are marked shipped.</p>
        </div>
      </section>
    </main>
  );
}
