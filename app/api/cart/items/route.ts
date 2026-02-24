import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getCartIdCookie, setCartIdCookie } from "@/lib/cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body =
  | { op: "add"; partNo: string; qty?: number }
  | { op: "set"; partNo: string; qty: number }
  | { op: "remove"; partNo: string };

async function ensureCart() {
  const session = await auth();
  const email = session?.user?.email ?? null;

  let userId: string | null = null;
  if (email) {
    const u = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    userId = u?.id ?? null;
  }

  const cookieCartId = await getCartIdCookie();

  // Prefer cookie cart, else user cart (if logged in)
  let cart =
    (cookieCartId
      ? await prisma.cart.findFirst({ where: { id: cookieCartId, status: "ACTIVE" } })
      : null) ??
    (userId ? await prisma.cart.findFirst({ where: { userId, status: "ACTIVE" } }) : null);

  // Create if missing
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: userId ?? null, status: "ACTIVE" },
    });
  } else if (userId && !cart.userId) {
    // Attach guest cart to user if logged in
    cart = await prisma.cart.update({
      where: { id: cart.id },
      data: { userId },
    });
  }

  // ✅ MUST await cookie set in app router
  await setCartIdCookie(cart.id);

  return cart;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !("op" in body)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const cart = await ensureCart();

  const partNo = typeof (body as any).partNo === "string" ? (body as any).partNo.trim() : "";
  if (!partNo) {
    return NextResponse.json({ error: "Missing partNo" }, { status: 400 });
  }

  if (body.op === "remove") {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, partNo } });
  }

  if (body.op === "set") {
    const qty = Math.max(0, Math.floor(Number(body.qty ?? 0)));
    if (qty <= 0) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id, partNo } });
    } else {
      await prisma.cartItem.upsert({
        where: { cartId_partNo: { cartId: cart.id, partNo } },
        create: { cartId: cart.id, partNo, qty },
        update: { qty },
      });
    }
  }

  if (body.op === "add") {
    const inc = Math.max(1, Math.floor(Number(body.qty ?? 1)));
    await prisma.cartItem.upsert({
      where: { cartId_partNo: { cartId: cart.id, partNo } },
      create: { cartId: cart.id, partNo, qty: inc },
      update: { qty: { increment: inc } },
    });
  }

  // Return updated cart items
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    select: { partNo: true, qty: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    ok: true,
    cart: { id: cart.id, items },
  });
}
