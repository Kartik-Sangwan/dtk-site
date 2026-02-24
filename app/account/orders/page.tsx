import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BASE_SHIPPING_RATE, TAX_RATE } from "@/lib/business";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "CAD",
  }).format((cents || 0) / 100);
}

function statusStyle(status: string) {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "PROCESSING":
      return "bg-indigo-50 text-indigo-800 border-indigo-200";
    case "SHIPPED":
      return "bg-sky-50 text-sky-800 border-sky-200";
    case "FULFILLED":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "AWAITING_PAYMENT":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "CANCELLED":
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

export default async function AccountOrdersPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          publicRef: true,
          status: true,
          paymentMethod: true,
          currency: true,
          subtotal: true,
          createdAt: true,
          items: {
            select: { id: true, partNo: true, qty: true, price: true },
          },
        },
      },
    },
  });

  const orders = user?.orders ?? [];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Order Status</h1>
            <p className="mt-1 text-sm text-gray-600">View previous orders and their latest status.</p>
          </div>

          <Link
            href="/account"
            className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-slate-50"
          >
            ← Back to Account
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-300 bg-white p-8 text-center shadow-sm">
            <div className="text-lg font-semibold text-gray-900">No orders yet</div>
            <p className="mt-2 text-sm text-gray-600">
              Orders you place will appear here with payment and fulfillment status.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const shippingCents = Math.round(order.subtotal * BASE_SHIPPING_RATE);
              const taxCents = Math.round(order.subtotal * TAX_RATE);
              const totalCents = order.subtotal + shippingCents + taxCents;
              const itemCount = order.items.reduce((sum, it) => sum + it.qty, 0);
              const ref = order.publicRef || order.id;

              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm md:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-gray-600">Order</div>
                      <div className="text-lg font-semibold text-gray-900">{ref}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                          statusStyle(order.status),
                        ].join(" ")}
                      >
                        {order.status.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {order.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                    <div>
                      <div className="text-gray-500">Placed on</div>
                      <div className="font-semibold text-gray-900">
                        {order.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Items</div>
                      <div className="font-semibold text-gray-900">{itemCount}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Subtotal</div>
                      <div className="font-semibold text-gray-900">
                        {money(order.subtotal, order.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Total (incl. shipping + tax)</div>
                      <div className="font-semibold text-gray-900">
                        {money(totalCents, order.currency)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/order/${ref}`}
                      className="inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                      View full order
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
