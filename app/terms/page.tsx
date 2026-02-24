export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
        <div className="mt-6 space-y-4 rounded-2xl border border-slate-300 bg-white p-6 text-sm text-slate-700">
          <p>Orders are subject to product availability, pricing validation, and final acceptance.</p>
          <p>Lead times are estimates and may change based on production and supplier conditions.</p>
          <p>Customers are responsible for validating part selection and application compatibility.</p>
          <p>Liability is limited to the order value except where prohibited by law.</p>
        </div>
      </section>
    </main>
  );
}
