import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { hashPassword, sha256Hex } from "@/lib/auth-security";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipLimit = checkRateLimit(`auth:reset:confirm:ip:${ip}`, {
      windowMs: 15 * 60 * 1000,
      max: 20,
      blockMs: 15 * 60 * 1000,
    });
    if (!ipLimit.ok) {
      return NextResponse.json(
        { ok: false, error: `Too many attempts. Try again in ${ipLimit.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const body = (await req.json()) as {
      email?: string;
      token?: string;
      password?: string;
    };

    const email = String(body?.email ?? "").trim().toLowerCase();
    const token = String(body?.token ?? "").trim();
    const password = String(body?.password ?? "");

    if (!email || !token || !password) {
      return NextResponse.json(
        { ok: false, error: "Missing reset parameters." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const tokenHash = sha256Hex(token);
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, email: true, expiresAt: true, consumedAt: true },
    });

    if (!record || record.email !== email) {
      return NextResponse.json({ ok: false, error: "Invalid reset link." }, { status: 400 });
    }
    if (record.consumedAt) {
      return NextResponse.json({ ok: false, error: "Reset link already used." }, { status: 400 });
    }
    if (record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: "Reset link expired." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { email },
        data: { passwordHash },
      });
      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      });
      await tx.passwordResetToken.deleteMany({
        where: { email, id: { not: record.id } },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Something went wrong." },
      { status: 500 }
    );
  }
}
