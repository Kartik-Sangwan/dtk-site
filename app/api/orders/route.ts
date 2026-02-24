import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { customAlphabet } from "nanoid";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import type { OrderStatus, PaymentMethod } from "@prisma/client";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CART_COOKIE = "dtk_cart_id";
const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

function makePublicRef() {
  return `DTK-${nano()}`; // e.g. DTK-7K9P2QXH
}

function isAllowedCountry(country: string) {
  const c = (country || "").trim().toUpperCase();
  return c === "CA" || c === "CANADA" || c === "US" || c === "USA" || c === "UNITED STATES";
}

function normalizeCountry(country: string) {
  const c = (country || "").trim().toUpperCase();
  if (c === "CANADA" || c === "CA") return "CA";
  if (c === "USA" || c === "UNITED STATES" || c === "US") return "US";
  return c;
}

function hasValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10;
}

async function getCartIdCookie(): Promise<string | null> {
  const c = await cookies();
  return c.get(CART_COOKIE)?.value ?? null;
}

async function clearCartIdCookie() {
  const c = await cookies();
  c.set(CART_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json();

  const {
    shipping,
    saveToProfile,
    stripePaymentIntentId,
  }: {
    shipping: {
      name?: string;
      email?: string;
      company?: string;
      phone?: string;
      line1: string;
      line2?: string;
      city: string;
      province: string;
      postal: string;
      country: string;
    };
    saveToProfile?: boolean;
    stripePaymentIntentId?: string;
  } = body;

  if (body?.paymentMethod && body.paymentMethod !== "STRIPE") {
    return NextResponse.json(
      { error: "Only card payments are currently supported." },
      { status: 400 }
    );
  }

  // ---- Validate shipping
  if (!shipping?.line1 || !shipping?.city || !shipping?.province || !shipping?.postal || !shipping?.country) {
    return NextResponse.json({ error: "Missing shipping fields" }, { status: 400 });
  }
  if (!isAllowedCountry(shipping.country)) {
    return NextResponse.json({ error: "Shipping is only available to Canada and USA" }, { status: 400 });
  }
  if (!hasValidPhone(String(shipping.phone ?? ""))) {
    return NextResponse.json(
      { error: "Phone number must include 10 digits (dashes/spaces allowed)." },
      { status: 400 }
    );
  }

  const country = normalizeCountry(shipping.country);

  // ---- Card payment requires a PaymentIntent
  if (!stripePaymentIntentId) {
    return NextResponse.json(
      { error: "Missing stripePaymentIntentId for card payment" },
      { status: 400 }
    );
  }

  // ---- Idempotency: if an order already exists for this intent, return it
  if (stripePaymentIntentId) {
    const existing = await prisma.order.findFirst({
      where: { stripePaymentIntentId },
      select: { id: true, publicRef: true, paymentMethod: true, status: true },
    });
    if (existing) {
      return NextResponse.json({
        ok: true,
        orderId: existing.id,
        publicRef: existing.publicRef,
        status: existing.status,
        paymentMethod: existing.paymentMethod,
        reused: true,
      });
    }
  }

  // ---- Load cart from cookie
  const cartId = await getCartIdCookie();
  if (!cartId) {
    return NextResponse.json({ error: "Cart is empty (missing cart cookie)" }, { status: 400 });
  }

  const cart = await prisma.cart.findFirst({
    where: { id: cartId, status: "ACTIVE" },
    include: { items: true },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // ---- Ask server pricing endpoint for totals (trusted prices)
  // This assumes you already have POST /api/checkout/summary which resolves prices/name/etc.
  const origin = new URL(req.url).origin;

  const summaryRes = await fetch(`${origin}/api/checkout/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      items: cart.items.map((it) => ({ partNo: it.partNo, qty: it.qty })),
    }),
  });

  if (!summaryRes.ok) {
    return NextResponse.json(
      { error: `Failed to compute totals: ${await summaryRes.text()}` },
      { status: 500 }
    );
  }

  const summary = await summaryRes.json();
  const subtotalCents: number = Number(summary?.subtotalCents ?? 0);

  // expected: items: [{ partNo, qty, unitPriceCents }]
  const pricedItems: { partNo: string; qty: number; unitPriceCents: number }[] =
    Array.isArray(summary?.items)
      ? summary.items.map((x: { partNo?: unknown; qty?: unknown; unitPriceCents?: unknown }) => ({
          partNo: String(x.partNo),
          qty: Number(x.qty ?? 0),
          unitPriceCents: Number(x.unitPriceCents ?? 0),
        }))
      : [];

  if (pricedItems.length === 0 || subtotalCents <= 0) {
    return NextResponse.json({ error: "Invalid cart totals" }, { status: 400 });
  }

  // ---- Attach userId if logged in + save address to profile if requested
  let userId: string | null = null;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id ?? null;

    if (userId && saveToProfile) {
      await prisma.address.upsert({
        where: { userId },
        create: {
          userId,
          company: shipping.company ?? null,
          phone: shipping.phone ?? null,
          line1: shipping.line1,
          line2: shipping.line2 ?? null,
          city: shipping.city,
          province: shipping.province,
          postalCode: shipping.postal,
          country,
        },
        update: {
          company: shipping.company ?? null,
          phone: shipping.phone ?? null,
          line1: shipping.line1,
          line2: shipping.line2 ?? null,
          city: shipping.city,
          province: shipping.province,
          postalCode: shipping.postal,
          country,
        },
      });
    }
  }

  // ---- Create order with unique publicRef (retry on collision)
  let order:
  | { id: string; publicRef: string | null; paymentMethod: PaymentMethod; status: OrderStatus }
  | undefined;

  for (let attempt = 0; attempt < 5; attempt++) {
    const publicRef = makePublicRef();

    try {
      order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            publicRef,
            userId,
            status: "AWAITING_PAYMENT",
            paymentMethod: "STRIPE",
            currency: country === "US" ? "USD" : "CAD",
            stripePaymentIntentId: stripePaymentIntentId ?? null,

            shipName: shipping.name ?? null,
            shipEmail: shipping.email ?? session?.user?.email ?? null,
            shipCompany: shipping.company ?? null,
            shipPhone: shipping.phone ?? null,
            shipLine1: shipping.line1,
            shipLine2: shipping.line2 ?? null,
            shipCity: shipping.city,
            shipProvince: shipping.province,
            shipPostal: shipping.postal,
            shipCountry: country,

            subtotal: subtotalCents,

            items: {
              create: pricedItems.map((it) => ({
                partNo: it.partNo,
                qty: Math.max(1, Number(it.qty || 1)),
                price: Math.round(Number(it.unitPriceCents || 0)), // cents per unit
              })),
            },
          },
          select: { id: true, publicRef: true, paymentMethod: true, status: true },
        });

        // Mark cart checked out so it can’t be reused accidentally
        await tx.cart.update({
          where: { id: cart.id },
          data: { status: "CHECKED_OUT" },
        });

        return created;
      });

      break; // success
    } catch (e: unknown) {
      // publicRef unique collision
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }

  if (!order) {
    return NextResponse.json({ error: "Failed to create order (retry exceeded)" }, { status: 500 });
  }

  // Optional: clear cookie so a new cart is created next time
  await clearCartIdCookie();

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    publicRef: order.publicRef ?? order.id,
    status: order.status,
    paymentMethod: order.paymentMethod,
  });
}
