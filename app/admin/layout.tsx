import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffActor } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getStaffActor();
  if (!actor) redirect("/login");

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-2xl border border-slate-300 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">Admin Portal</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Operations Console</h1>
          <p className="mt-2 text-sm text-slate-200">
            Signed in as {actor.email} ({actor.role})
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Orders
          </Link>
          <Link
            href="/admin/customers"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Customers
          </Link>
        </div>

        <div className="mt-4">{children}</div>
      </section>
    </main>
  );
}
