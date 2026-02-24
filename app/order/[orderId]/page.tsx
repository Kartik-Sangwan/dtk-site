export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import OrderStatusRefresh from "./OrderStatusRefresh";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId?: string }>;
  searchParams?: Promise<{ method?: string }>;
}) {
  const { orderId } = await params;
  const sp = searchParams ? await searchParams : {};

  if (!orderId) return notFound();

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { publicRef: orderId }],
    },
    include: { items: true },
  });

  if (!order) return notFound();

  if (order.publicRef && orderId !== order.publicRef) {
    const suffix = sp?.method ? `?method=${encodeURIComponent(sp.method)}` : "";
    redirect(`/order/${order.publicRef}${suffix}`);
  }

  const money = (cents: number, currency: string) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "CAD",
    }).format((cents || 0) / 100);

  const isInterac = order.paymentMethod === "INTERAC" || sp?.method === "interac";
  const isPaid = order.status === "PAID";
  const isProcessing = order.status === "PROCESSING";
  const isShipped = order.status === "SHIPPED";
  const isFulfilled = order.status === "FULFILLED";
  const shippingCents = Math.round(order.subtotal * 0.1);
  const totalCents = order.subtotal + shippingCents;
  const orderRef = order.publicRef || order.id;
  const eta = new Date(order.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
  const statusLabel = order.status.replaceAll("_", " ");

  const trackingSteps = [
    {
      title: "Order received",
      detail: `Placed on ${order.createdAt.toLocaleDateString()}`,
      state: "done" as const,
    },
    {
      title: "Payment confirmation",
      detail:
        isPaid || isProcessing || isShipped || isFulfilled
          ? "Payment confirmed"
          : "Pending confirmation",
      state:
        isPaid || isProcessing || isShipped || isFulfilled
          ? ("done" as const)
          : ("current" as const),
    },
    {
      title: "Processing",
      detail: isFulfilled ? "Completed" : isShipped ? "Completed" : isProcessing ? "In progress" : "Pending",
      state:
        isFulfilled || isShipped
          ? ("done" as const)
          : isProcessing
            ? ("current" as const)
            : ("pending" as const),
    },
    {
      title: "Shipment",
      detail: isFulfilled ? "Delivered" : isShipped ? "Dispatched" : "Pending",
      state: isFulfilled || isShipped ? ("done" as const) : ("pending" as const),
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-2xl border border-slate-300 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-5 text-white shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">Order Status</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{orderRef}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-300/70 bg-slate-600/40 px-3 py-1">
              {statusLabel}
            </span>
            <span className="rounded-full border border-slate-300/70 bg-slate-600/40 px-3 py-1">
              {order.paymentMethod}
            </span>
            <span className="rounded-full border border-slate-300/70 bg-slate-600/40 px-3 py-1">
              Last updated {order.updatedAt.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-4">
            <div
              className={[
                "rounded-2xl border p-5",
                isPaid || isFulfilled ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
              ].join(" ")}
            >
              <p className="text-sm font-semibold text-gray-900">
                {isPaid || isProcessing || isShipped || isFulfilled ? "Payment confirmed" : "Payment pending"}
              </p>
              {!isPaid && !isProcessing && !isShipped && !isFulfilled && (
                <OrderStatusRefresh enabled intervalMs={2000} maxSeconds={60} />
              )}
              {isPaid && order.receiptUrl && (
                <p className="mt-2 text-sm text-gray-700">
                  Receipt:{" "}
                  <a className="font-semibold text-blue-700 underline" href={order.receiptUrl} target="_blank">
                    View Stripe receipt
                  </a>
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Tracking Progress</h2>
              <ol className="mt-4 space-y-3">
                {trackingSteps.map((step) => (
                  <li key={step.title} className="flex items-start gap-3">
                    <span
                      className={[
                        "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                        step.state === "done"
                          ? "bg-emerald-600 text-white"
                          : step.state === "current"
                            ? "bg-amber-500 text-white"
                            : "bg-slate-200 text-slate-600",
                      ].join(" ")}
                    >
                      {step.state === "done" ? "✓" : "•"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                      <p className="text-sm text-gray-600">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {isInterac && (
              <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
                <div className="font-semibold text-gray-900">Interac e-Transfer instructions</div>
                <p className="mt-2 text-sm text-gray-700">
                  Send an Interac e-Transfer and include your order reference:
                </p>
                <div className="mt-3 rounded-lg border bg-slate-50 p-3 text-sm">
                  <div>
                    <span className="font-semibold">Reference:</span> {orderRef}
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Tracking Details</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tracking number</span>
                  <span className="font-semibold text-amber-700">Pending</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Carrier</span>
                  <span className="font-semibold text-amber-700">Pending</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated arrival</span>
                  <span className="font-semibold text-gray-900">{eta}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              <div className="mt-3 space-y-2">
                {order.items.map((it) => (
                  <div key={it.id} className="flex items-start justify-between text-sm">
                    <div>
                      <div className="font-semibold text-gray-900">{it.partNo}</div>
                      <div className="text-gray-600">Qty: {it.qty}</div>
                    </div>
                    <div className="font-semibold text-gray-900">
                      {money(it.price * it.qty, order.currency)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="my-4 h-px bg-slate-200" />

              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Subtotal</span>
                <span className="font-semibold text-gray-900">{money(order.subtotal, order.currency)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-700">Shipping (10%)</span>
                <span className="font-semibold text-gray-900">{money(shippingCents, order.currency)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">{money(totalCents, order.currency)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
              <div className="mt-2 text-sm text-gray-700">
                {order.shipName ?? ""}
                {order.shipCompany ? ` — ${order.shipCompany}` : ""}
                <br />
                {order.shipLine1}
                {order.shipLine2 ? `, ${order.shipLine2}` : ""}
                <br />
                {order.shipCity}, {order.shipProvince} {order.shipPostal}
                <br />
                {order.shipCountry}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
