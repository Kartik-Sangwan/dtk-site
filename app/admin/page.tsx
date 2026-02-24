import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [totalOrders, awaitingPayment, inProgress, shipped, customers] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "AWAITING_PAYMENT" } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
    prisma.user.count(),
  ]);

  const cards = [
    { label: "Total Orders", value: totalOrders },
    { label: "Awaiting Payment", value: awaitingPayment },
    { label: "In Progress", value: inProgress },
    { label: "Shipped", value: shipped },
    { label: "Customer Profiles", value: customers },
  ];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/orders"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Manage Orders
          </Link>
          <Link
            href="/admin/customers"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            View Customer Profiles
          </Link>
        </div>
      </div>
    </div>
  );
}
