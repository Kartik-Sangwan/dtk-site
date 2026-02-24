export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
        <div className="mt-6 space-y-4 rounded-2xl border border-slate-300 bg-white p-6 text-sm text-slate-700">
          <p>We collect contact, shipping, and order data required to process and fulfill orders.</p>
          <p>Payment processing is handled by Stripe; card data is not stored in this application.</p>
          <p>We use account credentials and session data for authentication and account security.</p>
          <p>For data correction or account-related requests, contact support.</p>
        </div>
      </section>
    </main>
  );
}
