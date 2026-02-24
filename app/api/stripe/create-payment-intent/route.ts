import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const amountCents = Number(body?.amountCents);
  const currency = String(body?.currency || "cad").toLowerCase();

  if (!Number.isFinite(amountCents) || amountCents < 50) {
    return NextResponse.json({ error: "amountCents must be a number >= 50" }, { status: 400 });
  }

  const receiptEmail =
    typeof body?.receiptEmail === "string"
      ? body.receiptEmail
      : typeof body?.email === "string"
      ? body.email
      : undefined;

  const cart = typeof body?.cart === "string" ? body.cart.slice(0, 500) : undefined;
  const shipping = body?.shipping;
  const billing = body?.billing;

  const shippingParam: Stripe.PaymentIntentCreateParams.Shipping | undefined =
    shipping && typeof shipping === "object"
      ? {
          name: typeof shipping?.name === "string" ? shipping.name : undefined,
          phone: typeof shipping?.phone === "string" ? shipping.phone : undefined,
          address: {
            line1: typeof shipping?.line1 === "string" ? shipping.line1 : undefined,
            line2: typeof shipping?.line2 === "string" ? shipping.line2 : undefined,
            city: typeof shipping?.city === "string" ? shipping.city : undefined,
            state:
              typeof shipping?.province === "string"
                ? shipping.province
                : typeof shipping?.state === "string"
                ? shipping.state
                : undefined,
            postal_code:
              typeof shipping?.postal === "string"
                ? shipping.postal
                : typeof shipping?.postal_code === "string"
                ? shipping.postal_code
                : undefined,
            country: typeof shipping?.country === "string" ? shipping.country : undefined,
          },
        }
      : undefined;

  const billingCountry =
    billing && typeof billing?.country === "string" ? billing.country.toUpperCase() : "";
  const billingPostal =
    billing && typeof billing?.postal === "string" ? billing.postal.slice(0, 20) : "";

  const idempotencyKey = req.headers.get("x-idempotency-key") ?? undefined;

  try {
    const pi = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency,
        payment_method_types: ["card"],
        receipt_email: receiptEmail,
        shipping: shippingParam,
        metadata: {
          source: "dtk_place_order",
          cart: cart || "",
          billing_country: billingCountry,
          billing_postal: billingPostal,
        },
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    return NextResponse.json({ clientSecret: pi.client_secret, paymentIntentId: pi.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
