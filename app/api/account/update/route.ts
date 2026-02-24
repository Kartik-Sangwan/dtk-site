import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type AccountUpdatePayload = {
  name?: unknown;
  company?: unknown;
  phone?: unknown;
  line1?: unknown;
  line2?: unknown;
  city?: unknown;
  province?: unknown;
  postalCode?: unknown;
  country?: unknown;
};

function clean(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as AccountUpdatePayload;

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    create: {
      email: session.user.email,
      name: clean(body.name) ?? session.user.name ?? null,
      image: session.user.image ?? null,
      address: {
        create: {
          company: clean(body.company),
          phone: clean(body.phone),
          line1: clean(body.line1),
          line2: clean(body.line2),
          city: clean(body.city),
          province: clean(body.province),
          postalCode: clean(body.postalCode),
          country: clean(body.country),
        },
      },
    },
    update: {
      name: clean(body.name) ?? session.user.name ?? null,
      address: {
        upsert: {
          create: {
            company: clean(body.company),
            phone: clean(body.phone),
            line1: clean(body.line1),
            line2: clean(body.line2),
            city: clean(body.city),
            province: clean(body.province),
            postalCode: clean(body.postalCode),
            country: clean(body.country),
          },
          update: {
            company: clean(body.company),
            phone: clean(body.phone),
            line1: clean(body.line1),
            line2: clean(body.line2),
            city: clean(body.city),
            province: clean(body.province),
            postalCode: clean(body.postalCode),
            country: clean(body.country),
          },
        },
      },
    },
    include: { address: true },
  });

  return NextResponse.json({ ok: true, user });
}
