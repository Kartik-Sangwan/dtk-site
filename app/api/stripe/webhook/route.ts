import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { DEFAULT_FROM, SALES_EMAIL } from "@/lib/email-defaults";
import { escapeHtml, renderIndustrialEmail } from "@/lib/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
// ✅ For dev/testing, Resend's default sender works.
// In production, set FROM_EMAIL to a verified domain sender in Resend.
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.AUTH_FROM_EMAIL || DEFAULT_FROM;
const COMPANY_ORDER_EMAIL = process.env.COMPANY_ORDER_EMAIL || SALES_EMAIL;

const stripe = new Stripe(STRIPE_SECRET_KEY);
const resend = new Resend(RESEND_API_KEY);

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "CAD",
  }).format((cents || 0) / 100);
}

function eta7Days(createdAt: Date) {
  const eta = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  return eta.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderOrderEmailHTML(opts: {
  headline: string;
  orderId: string; // ✅ display label (publicRef preferred)
  createdAt: Date;
  currency: string;
  subtotalCents: number;
  receiptUrl?: string | null;
  items: { partNo: string; qty: number; priceCents: number }[];
}) {
  const shippingCents = Math.round(opts.subtotalCents * 0.1);
  const totalCents = opts.subtotalCents + shippingCents;
  const rows = opts.items
    .map(
      (it) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;">${escapeHtml(it.partNo)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:center;color:#0f172a;font-size:14px;">${it.qty}</td>
          <td style="padding:6px 0; text-align:right;">${money(
            it.priceCents * it.qty,
            opts.currency
          )}</td>
        </tr>`
    )
    .join("");

  const receiptHtml = opts.receiptUrl
    ? `<p style="margin:12px 0 0;color:#0f172a;font-size:14px;">Stripe receipt: <a href="${opts.receiptUrl}" style="color:#0f172a;text-decoration:underline;">${escapeHtml(opts.receiptUrl)}</a></p>`
    : "";

  return renderIndustrialEmail({
    preheader: `Order ${opts.orderId} payment received`,
    title: opts.headline,
    subtitle: `Order ${opts.orderId} | Estimated arrival ${eta7Days(opts.createdAt)}`,
    sections: [
      {
        heading: "Items",
        bodyHtml: `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left;padding:0 0 8px;color:#475569;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;">Item</th>
                <th style="text-align:center;padding:0 0 8px;color:#475569;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;">Qty</th>
                <th style="text-align:right;padding:0 0 8px;color:#475569;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `,
      },
      {
        heading: "Totals",
        bodyHtml: `
          <p style="margin:0;color:#0f172a;font-size:14px;"><strong>Subtotal:</strong> ${money(opts.subtotalCents, opts.currency)}</p>
          <p style="margin:8px 0 0;color:#0f172a;font-size:14px;"><strong>Shipping (10%):</strong> ${money(shippingCents, opts.currency)}</p>
          <p style="margin:8px 0 0;color:#0f172a;font-size:14px;"><strong>Order total:</strong> ${money(totalCents, opts.currency)}</p>
          ${receiptHtml}
        `,
      },
    ],
    footerNote: "Reply to this email with your order reference if you need help.",
  });
}

export async function POST(req: Request) {
  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  // Stripe signature verification requires raw body
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!sig) throw new Error("Missing stripe-signature header");
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  try {
    if (event.type !== "payment_intent.succeeded") {
      return NextResponse.json({ ok: true, ignored: event.type });
    }

    const intent = event.data.object as Stripe.PaymentIntent;

    const order = await prisma.order.findFirst({
      where: { stripePaymentIntentId: intent.id },
      include: { items: true },
    });

    if (!order) return NextResponse.json({ ok: true, matched: false });
    if (order.status === "PAID") return NextResponse.json({ ok: true, alreadyPaid: true });

    // Best-effort receipt URL retrieval
    let receiptUrl: string | null = null;
    try {
      const pi = await stripe.paymentIntents.retrieve(intent.id, {
        expand: ["latest_charge"],
      });
      const ch = pi.latest_charge as Stripe.Charge | null;
      receiptUrl = ch?.receipt_url ?? null;
    } catch {
      // ignore
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        receiptUrl,
      },
      include: { items: true },
    });

    // ✅ Prefer pretty order ref
    const orderLabel = updated.publicRef ?? updated.id;

    // Send emails only once (and only mark sent if at least one email was actually sent)
    if (!updated.confirmationEmailSent) {
      const customerEmail = updated.shipEmail || undefined;
      const companyEmail = COMPANY_ORDER_EMAIL || undefined;

      const items = updated.items.map((it) => ({
        partNo: it.partNo,
        qty: it.qty,
        priceCents: it.price,
      }));

      const customerHTML = renderOrderEmailHTML({
        headline: "Payment received — your order is confirmed",
        orderId: orderLabel, // ✅ publicRef in body
        createdAt: updated.createdAt,
        currency: updated.currency,
        subtotalCents: updated.subtotal,
        receiptUrl: updated.receiptUrl,
        items,
      });

      const companyHTML = renderOrderEmailHTML({
        headline: "New order received",
        orderId: orderLabel, // ✅ publicRef in body
        createdAt: updated.createdAt,
        currency: updated.currency,
        subtotalCents: updated.subtotal,
        receiptUrl: updated.receiptUrl,
        items,
      });

      let sentAny = false;

      if (!RESEND_API_KEY) {
        console.warn("RESEND_API_KEY missing; skipping email sending");
      } else {
        try {
          if (customerEmail) {
            await resend.emails.send({
              from: FROM_EMAIL,
              to: [customerEmail],
              subject: `Order confirmed: ${orderLabel}`, // ✅ publicRef in subject
              html: customerHTML,
              // optional: replies go to your support inbox
              // replyTo: "support@yourdomain.com",
            });
            sentAny = true;
          } else {
            console.warn("No shipEmail on order; skipping customer email");
          }

          if (companyEmail) {
            await resend.emails.send({
              from: FROM_EMAIL,
              to: [companyEmail],
              subject: `New order received: ${orderLabel}`, // ✅ publicRef in subject
              html: companyHTML,
              // optional: make replying go to customer
              // replyTo: customerEmail,
            });
            sentAny = true;
          } else {
            console.warn("COMPANY_ORDER_EMAIL missing; skipping company email");
          }
        } catch (e) {
          console.error("Resend send failed:", e);
        }
      }

      // ✅ Only mark sent if something actually sent
      if (sentAny) {
        await prisma.order.update({
          where: { id: updated.id },
          data: { confirmationEmailSent: true },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Webhook failed";
    // Returning 500 makes Stripe retry (useful if email or DB temporarily fails)
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
