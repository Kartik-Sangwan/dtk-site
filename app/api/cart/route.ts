import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getCartIdCookie, setCartIdCookie } from "@/lib/cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CartLine = { partNo: string; qty: number };

type Body =
  | { op: "add"; partNo: string; qty?: number }
  | { op: "set"; partNo: string; qty: number }
  | { op: "remove"; partNo: string };

async function getUserIdFromSession(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email) return null;

  const u = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return u?.id ?? null;
}

/** Merge source cart into target cart (sum qty by partNo), then delete source cart. */
async function mergeCarts(targetCartId: string, sourceCartId: string) {
  if (targetCartId === sourceCartId) return;

  const sourceItems = await prisma.cartItem.findMany({
    where: { cartId: sourceCartId },
    select: { partNo: true, qty: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const it of sourceItems) {
      await tx.cartItem.upsert({
        where: { cartId_partNo: { cartId: targetCartId, partNo: it.partNo } },
        create: { cartId: targetCartId, partNo: it.partNo, qty: it.qty },
        update: { qty: { increment: it.qty } },
      });
    }

    // delete source cart (items cascade)
    await tx.cart.delete({ where: { id: sourceCartId } });
  });
}

/** Ensure there is an ACTIVE cart for this visitor; merge cookie cart into user cart when logged in. */
async function resolveCart(): Promise<{ id: string; userId: string | null }> {
  const userId = await getUserIdFromSession();
  const cookieCartId = await getCartIdCookie();

  const cookieCart = cookieCartId
    ? await prisma.cart.findFirst({
        where: { id: cookieCartId, status: "ACTIVE" },
        select: { id: true, userId: true },
      })
    : null;

  const userCart = userId
    ? await prisma.cart.findFirst({
        where: { userId, status: "ACTIVE" },
        select: { id: true, userId: true },
      })
    : null;

  // If logged in and both exist (and different), merge cookie -> user cart
  if (userId && userCart && cookieCart && userCart.id !== cookieCart.id) {
    await mergeCarts(userCart.id, cookieCart.id);
    await setCartIdCookie(userCart.id);
    return { id: userCart.id, userId };
  }

  // If logged in and only cookie cart exists, attach it
  if (userId && cookieCart && !cookieCart.userId) {
    const updated = await prisma.cart.update({
      where: { id: cookieCart.id },
      data: { userId },
      select: { id: true, userId: true },
    });
    await setCartIdCookie(updated.id);
    return { id: updated.id, userId };
  }

  // Prefer user cart if logged in; else cookie cart
  if (userCart) {
    await setCartIdCookie(userCart.id);
    return { id: userCart.id, userId };
  }

  if (cookieCart) {
    await setCartIdCookie(cookieCart.id);
    return { id: cookieCart.id, userId: cookieCart.userId ?? null };
  }

  // Create new cart
  const created = await prisma.cart.create({
    data: { userId: userId ?? null, status: "ACTIVE" },
    select: { id: true, userId: true },
  });

  await setCartIdCookie(created.id);
  return { id: created.id, userId: created.userId ?? null };
}

export async function GET() {
  const cart = await resolveCart();
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

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  // Validate
  if (!body || typeof body !== "object" || !("op" in body)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!("partNo" in body) || !String((body as any).partNo ?? "").trim()) {
    return NextResponse.json({ error: "Missing partNo" }, { status: 400 });
  }

  const cart = await resolveCart();
  const partNo = String((body as any).partNo).trim();

  if (body.op === "remove") {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, partNo } });
  } else if (body.op === "set") {
    const qty = Math.max(0, Math.floor(Number((body as any).qty ?? 0)));
    if (qty <= 0) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id, partNo } });
    } else {
      await prisma.cartItem.upsert({
        where: { cartId_partNo: { cartId: cart.id, partNo } },
        create: { cartId: cart.id, partNo, qty },
        update: { qty },
      });
    }
  } else if (body.op === "add") {
    const inc = Math.max(1, Math.floor(Number((body as any).qty ?? 1)));
    await prisma.cartItem.upsert({
      where: { cartId_partNo: { cartId: cart.id, partNo } },
      create: { cartId: cart.id, partNo, qty: inc },
      update: { qty: { increment: inc } },
    });
  } else {
    return NextResponse.json({ error: "Invalid op" }, { status: 400 });
  }

  const items: CartLine[] = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    select: { partNo: true, qty: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    ok: true,
    cart: { id: cart.id, items },
  });
}
