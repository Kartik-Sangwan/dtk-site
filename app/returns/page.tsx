export default function ReturnsPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Returns Policy</h1>
        <div className="mt-6 space-y-4 rounded-2xl border border-slate-300 bg-white p-6 text-sm text-slate-700">
          <p>Return requests must be submitted before shipping or within an agreed return window.</p>
          <p>Custom, made-to-order, or modified parts may be non-returnable unless defective.</p>
          <p>For return approval, contact support with order reference, part number, and reason.</p>
          <p>Approved returns must be shipped with adequate packaging to prevent transit damage.</p>
        </div>
      </section>
    </main>
  );
}
