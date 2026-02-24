import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Shape expected from the client form
type ProfilePayload = {
  name?: string;
  email?: string; // ignored (server trusts session)
  image?: string | null;
  company?: string | null;
  phone?: string | null;
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

function clean(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ProfilePayload;
  try {
    body = (await req.json()) as ProfilePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 1) Ensure the User row exists even on the *first* save
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: clean(body.name) ?? session.user?.name ?? null,
      image: session.user?.image ?? null,
    },
    update: {
      name: clean(body.name) ?? session.user?.name ?? null,
      image: clean(body.image) ?? session.user?.image ?? null,
    },
    select: { id: true, email: true, name: true, image: true },
  });

  // 2) Upsert ShippingAddress (model maps to table "Address")
  await prisma.address.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      company: clean(body.company),
      phone: clean(body.phone),
      line1: clean(body.shippingAddress1),
      line2: clean(body.shippingAddress2),
      city: clean(body.city),
      province: clean(body.province),
      postalCode: clean(body.postalCode),
      country: clean(body.country),
    },
    update: {
      company: clean(body.company),
      phone: clean(body.phone),
      line1: clean(body.shippingAddress1),
      line2: clean(body.shippingAddress2),
      city: clean(body.city),
      province: clean(body.province),
      postalCode: clean(body.postalCode),
      country: clean(body.country),
    },
  });

  // 3) Return canonical saved profile (prevents [object Object] bugs)
  const fresh = await prisma.user.findUnique({
    where: { email },
    select: {
      name: true,
      email: true,
      image: true,
      address: {
        select: {
          company: true,
          phone: true,
          line1: true,
          line2: true,
          city: true,
          province: true,
          postalCode: true,
          country: true,
        },
      },
    },
  });

  const profile = {
    name: fresh?.name ?? "",
    email: fresh?.email ?? email,
    company: fresh?.address?.company ?? "",
    phone: fresh?.address?.phone ?? "",
    shippingAddress1: fresh?.address?.line1 ?? "",
    shippingAddress2: fresh?.address?.line2 ?? "",
    city: fresh?.address?.city ?? "",
    province: fresh?.address?.province ?? "",
    postalCode: fresh?.address?.postalCode ?? "",
    country: fresh?.address?.country ?? "",
  };

  return NextResponse.json({ ok: true, profile });
}
