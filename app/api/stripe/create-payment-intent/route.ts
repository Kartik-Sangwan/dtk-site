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
  const shippingObj =
    shipping && typeof shipping === "object" ? (shipping as Record<string, unknown>) : null;
  const billingObj =
    billing && typeof billing === "object" ? (billing as Record<string, unknown>) : null;
  let shippingParam: Stripe.PaymentIntentCreateParams.Shipping | undefined;
  if (shippingObj && typeof shippingObj.name === "string") {
    const address: Stripe.AddressParam = {};
    if (typeof shippingObj.line1 === "string") address.line1 = shippingObj.line1;
    if (typeof shippingObj.line2 === "string") address.line2 = shippingObj.line2;
    if (typeof shippingObj.city === "string") address.city = shippingObj.city;
    if (typeof shippingObj.province === "string") {
      address.state = shippingObj.province;
    } else if (typeof shippingObj.state === "string") {
      address.state = shippingObj.state;
    }
    if (typeof shippingObj.postal === "string") {
      address.postal_code = shippingObj.postal;
    } else if (typeof shippingObj.postal_code === "string") {
      address.postal_code = shippingObj.postal_code;
    }
    if (typeof shippingObj.country === "string") address.country = shippingObj.country;

    shippingParam = {
      name: shippingObj.name,
      ...(typeof shippingObj.phone === "string" ? { phone: shippingObj.phone } : {}),
      address,
    };
  }

  const billingCountry =
    billingObj && typeof billingObj.country === "string" ? billingObj.country.toUpperCase() : "";
  const billingPostal =
    billingObj && typeof billingObj.postal === "string" ? billingObj.postal.slice(0, 20) : "";

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
