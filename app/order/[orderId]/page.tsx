export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BASE_SHIPPING_RATE, TAX_RATE } from "@/lib/business";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import OrderStatusRefresh from "./OrderStatusRefresh";
import { House, PackageSearch, Truck } from "lucide-react";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await params;

  if (!orderId) return notFound();
  const session = await auth();

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { publicRef: orderId }],
    },
    include: { items: true },
  });

  if (!order) return notFound();

  if (order.publicRef && orderId !== order.publicRef) {
    redirect(`/order/${order.publicRef}`);
  }

  const money = (cents: number, currency: string) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "CAD",
    }).format((cents || 0) / 100);

  const isPaid = order.status === "PAID";
  const isProcessing = order.status === "PROCESSING";
  const isShipped = order.status === "SHIPPED";
  const isFulfilled = order.status === "FULFILLED";
  const shippingCents = Math.round(order.subtotal * BASE_SHIPPING_RATE);
  const taxCents = Math.round(order.subtotal * TAX_RATE);
  const totalCents = order.subtotal + shippingCents + taxCents;
  const orderRef = order.publicRef || order.id;
  const eta = new Date(order.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
  const statusLabel = order.status.replaceAll("_", " ");
  const showTrackingLink = (isShipped || isFulfilled) && !!order.trackingUrl;
  const isGuestViewer = !session?.user?.email;
  const existingUser =
    order.shipEmail
      ? await prisma.user.findUnique({
          where: { email: order.shipEmail.toLowerCase() },
          select: { id: true },
        })
      : null;
  const authMode = existingUser ? "signin" : "signup";
  const guestAuthHref = `/login?mode=${authMode}${
    order.shipEmail ? `&email=${encodeURIComponent(order.shipEmail)}` : ""
  }${
    !existingUser && order.shipName ? `&name=${encodeURIComponent(order.shipName)}` : ""
  }`;

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
            {isGuestViewer && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
                <p className="text-sm font-semibold text-indigo-900">
                  {existingUser
                    ? "You already have an account. Sign in to link this order to your order history."
                    : "Save this order to your account for faster tracking next time."}
                </p>
                <p className="mt-2 text-sm text-indigo-800">
                  {existingUser
                    ? "Use the same checkout email to sign in quickly."
                    : "Create an account or sign in using the same checkout email to see order history in one place."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={guestAuthHref}
                    className="inline-flex rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    {existingUser ? "Sign in" : "Create account / Sign in"}
                  </Link>
                  <span className="inline-flex items-center rounded-md border border-indigo-200 bg-white px-3 py-2 text-xs text-indigo-900">
                    Keep order ref: {orderRef}
                  </span>
                </div>
              </div>
            )}

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
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Truck className="h-5 w-5 text-slate-600" aria-hidden="true" />
                Tracking Progress
              </h2>
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

            <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900">
                <House className="h-5 w-5 text-slate-600" aria-hidden="true" />
                Shipping Address
              </h2>
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

          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900">
                <PackageSearch className="h-5 w-5 text-slate-600" aria-hidden="true" />
                Tracking Details
              </h2>
              <div className="mt-3 text-sm text-gray-700">
                {showTrackingLink ? (
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      Your order has shipped. Use the tracking link below to follow delivery.
                    </p>
                    <a
                      href={order.trackingUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Open Tracking Link
                    </a>
                    <div className="flex justify-between pt-2">
                      <span className="text-gray-600">Estimated arrival</span>
                      <span className="font-semibold text-gray-900">{eta}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-amber-700">
                      Tracking details will be available once shipped.
                    </p>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated arrival</span>
                      <span className="font-semibold text-gray-900">{eta}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Current status</span>
                  <span className="font-semibold text-gray-900">{statusLabel}</span>
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
                <span className="text-gray-700">Tax (13%)</span>
                <span className="font-semibold text-gray-900">{money(taxCents, order.currency)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">{money(totalCents, order.currency)}</span>
              </div>
            </div>

          </aside>
        </div>
      </section>
    </main>
  );
}
