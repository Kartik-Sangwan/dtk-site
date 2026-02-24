// app/api/checkout/summary/route.ts
import { NextResponse } from "next/server";
import { findInventoryRowsByPartNos } from "@/lib/inventory";
import { BASE_SHIPPING_RATE, TAX_RATE } from "@/lib/business";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CartLine = { partNo: string; qty: number };

function safeQty(n: unknown) {
  const q = Math.floor(Number(n ?? 0));
  return Number.isFinite(q) ? Math.max(0, q) : 0;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { items?: CartLine[] };

    const lines = Array.isArray(body?.items) ? body.items : [];
    if (!lines.length) {
      return NextResponse.json({
        ok: true,
        currency: "CAD",
        lineItems: [],
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        // cents shape too
        subtotalCents: 0,
        shippingCents: 0,
        taxCents: 0,
        totalCents: 0,
        items: [],
      });
    }

    const currency = "CAD";
    const partNos = lines.map((it) => String(it?.partNo ?? "").trim()).filter(Boolean);
    const inventoryByPart = await findInventoryRowsByPartNos(partNos);

    const lineItems = lines
      .map((it) => {
        const partNo = String(it?.partNo ?? "").trim();
        const qty = safeQty(it?.qty);
        if (!partNo || qty <= 0) return null;

        const inv = inventoryByPart[partNo];
        const unitPriceCents = Math.max(0, Math.round(Number(inv?.price ?? 0) * 100));
        const unitPrice = unitPriceCents / 100;
        const lineTotal = (unitPriceCents * qty) / 100;

        return {
          partNo,
          qty,
          name: inv?.description || partNo,
          subcategory: "",
          image: "/products/alignment-coupler.png",
          price: unitPrice, // dollars
          lineTotal, // dollars
          // cents extras (useful for PlaceOrderClient / Stripe)
          unitPriceCents,
        };
      })
      .filter(Boolean) as Array<{
      partNo: string;
      qty: number;
      name?: string;
      subcategory?: string;
      image?: string;
      price: number;
      lineTotal: number;
      unitPriceCents: number;
    }>;

    const subtotal = lineItems.reduce((s, it) => s + (Number(it.lineTotal) || 0), 0);
    const subtotalCents = Math.round(subtotal * 100);
    const shippingCents = Math.round(subtotalCents * BASE_SHIPPING_RATE);
    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const totalCents = subtotalCents + shippingCents + taxCents;

    const shipping = shippingCents / 100;
    const tax = taxCents / 100;
    const total = totalCents / 100;

    return NextResponse.json({
      ok: true,

      // ✅ CheckoutClient expects these (dollars)
      currency,
      lineItems,
      subtotal,
      shipping,
      tax,
      total,

      // ✅ PlaceOrderClient / Stripe-friendly (cents)
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      items: lineItems.map((it) => ({
        partNo: it.partNo,
        qty: it.qty,
        name: it.name,
        images: it.image ? [it.image] : [],
        unitPriceCents: it.unitPriceCents,
      })),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Bad request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
