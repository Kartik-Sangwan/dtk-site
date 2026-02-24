"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffActor } from "@/lib/admin";
import type { OrderStatus } from "@prisma/client";
import { Resend } from "resend";
import { DEFAULT_FROM, SALES_EMAIL } from "@/lib/email-defaults";
import { renderIndustrialEmail } from "@/lib/email-templates";

const ALLOWED_STATUSES: OrderStatus[] = [
  "AWAITING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "FULFILLED",
  "CANCELLED",
];

function parseStatus(value: string): OrderStatus | null {
  return ALLOWED_STATUSES.find((status) => status === value) ?? null;
}

const resend = new Resend(process.env.RESEND_API_KEY);

function isLikelyUrl(value: string) {
  return /^https?:\/\/\S+$/i.test(value);
}

function fail(message: string) {
  redirect(`/admin/orders?err=${encodeURIComponent(message)}`);
}

export async function updateOrderStatusAction(formData: FormData) {
  const actor = await getStaffActor();
  if (!actor) fail("Unauthorized");

  const orderId = String(formData.get("orderId") ?? "");
  const nextStatusRaw = String(formData.get("status") ?? "");
  const trackingUrlRaw = String(formData.get("trackingUrl") ?? "").trim();
  const trackingUrl = trackingUrlRaw.length ? trackingUrlRaw : null;
  const nextStatus = parseStatus(nextStatusRaw);
  if (!orderId || !nextStatus) fail("Invalid order status update payload");
  if (trackingUrl && !isLikelyUrl(trackingUrl)) {
    fail("Tracking link must start with http:// or https://");
  }

  let existing: {
    id: string;
    publicRef: string | null;
    status: OrderStatus;
    shipEmail: string | null;
    shipName: string | null;
  } | null = null;
  try {
    existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        publicRef: true,
        status: true,
        shipEmail: true,
        shipName: true,
      },
    });
  } catch (err: unknown) {
    fail(err instanceof Error ? err.message : "Could not read order");
  }
  if (!existing) fail("Order not found");

  const nextShippedAt = nextStatus === "SHIPPED" ? new Date() : null;

  let updated: {
    id: string;
    publicRef: string | null;
    status: OrderStatus;
    shipEmail: string | null;
    shipName: string | null;
    trackingUrl: string | null;
    shippedAt: Date | null;
  };
  try {
    updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
        trackingUrl: trackingUrl ?? undefined,
        shippedAt: nextShippedAt ?? undefined,
      },
      select: {
        id: true,
        publicRef: true,
        status: true,
        shipEmail: true,
        shipName: true,
        trackingUrl: true,
        shippedAt: true,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not update order";
    const missingTrackingFields =
      message.includes("Unknown argument `trackingUrl`") ||
      message.includes("Unknown field `trackingUrl`") ||
      message.includes("Unknown field `shippedAt`");

    if (!missingTrackingFields) {
      fail(message);
    }

    // Backward-compatible fallback for stale Prisma client / schema mismatch.
    let legacyUpdated: {
      id: string;
      publicRef: string | null;
      status: OrderStatus;
      shipEmail: string | null;
      shipName: string | null;
    };
    try {
      legacyUpdated = await prisma.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
        select: {
          id: true,
          publicRef: true,
          status: true,
          shipEmail: true,
          shipName: true,
        },
      });
    } catch (legacyErr: unknown) {
      fail(legacyErr instanceof Error ? legacyErr.message : "Could not update order");
    }

    revalidatePath("/admin/orders");
    revalidatePath("/account/orders");
    revalidatePath(`/order/${orderId}`);
    if (legacyUpdated.publicRef) revalidatePath(`/order/${legacyUpdated.publicRef}`);
    fail("Order status updated, but tracking fields are not active yet. Restart the server after Prisma generate.");
  }

  const shippingJustMarked = existing.status !== "SHIPPED" && updated.status === "SHIPPED";

  if (
    shippingJustMarked &&
    updated.shipEmail &&
    updated.trackingUrl &&
    process.env.RESEND_API_KEY
  ) {
    const orderLabel = updated.publicRef || updated.id;
    const customerName = updated.shipName || "Customer";
    const shippedDate = updated.shippedAt
      ? updated.shippedAt.toLocaleDateString()
      : new Date().toLocaleDateString();

    const html = renderIndustrialEmail({
      preheader: `Order ${orderLabel} has shipped`,
      title: "Your Order Has Shipped",
      subtitle: `Hi ${customerName}, your order ${orderLabel} is now on its way.`,
      sections: [
        {
          heading: "Shipping Details",
          bodyHtml: `
            <p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;">
              <strong>Order:</strong> ${orderLabel}<br/>
              <strong>Status:</strong> Shipped<br/>
              <strong>Shipped on:</strong> ${shippedDate}
            </p>
          `,
        },
      ],
      cta: { label: "Track Shipment", href: updated.trackingUrl },
    });

    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || process.env.AUTH_FROM_EMAIL || DEFAULT_FROM,
        to: [updated.shipEmail],
        subject: `Your order has shipped: ${orderLabel}`,
        html,
        replyTo: SALES_EMAIL,
      });
    } catch (err: unknown) {
      fail(err instanceof Error ? `Order updated, but email failed: ${err.message}` : "Order updated, but email failed");
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
  revalidatePath(`/order/${orderId}`);
  if (updated.publicRef) revalidatePath(`/order/${updated.publicRef}`);
  redirect("/admin/orders?ok=1");
}
