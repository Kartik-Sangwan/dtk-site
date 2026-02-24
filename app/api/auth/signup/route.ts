import { NextResponse } from "next/server";
import { DEFAULT_FROM } from "@/lib/email-defaults";
import { Resend } from "resend";
import { renderIndustrialEmail } from "@/lib/email-templates";

import { prisma } from "@/lib/prisma";
import { generateVerificationToken, hashPassword, sha256Hex } from "@/lib/auth-security";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const ip = getClientIp(req);

    const ipLimit = checkRateLimit(`auth:signup:ip:${ip}`, {
      windowMs: 15 * 60 * 1000,
      max: 10,
      blockMs: 20 * 60 * 1000,
    });
    if (!ipLimit.ok) {
      return NextResponse.json(
        { ok: false, error: `Too many attempts. Try again in ${ipLimit.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const emailLimit = checkRateLimit(`auth:signup:email:${email}`, {
      windowMs: 30 * 60 * 1000,
      max: 4,
      blockMs: 30 * 60 * 1000,
    });
    if (!emailLimit.ok) {
      return NextResponse.json(
        { ok: false, error: `Too many attempts for this email. Try again in ${emailLimit.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { ok: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    });

    if (existing?.emailVerified) {
      return NextResponse.json(
        { ok: false, error: "An account already exists for this email. Please sign in." },
        { status: 409 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Email service is not configured. Please contact support." },
        { status: 500 }
      );
    }

    const passwordHash = await hashPassword(password);
    const token = generateVerificationToken();
    const tokenHash = sha256Hex(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { email },
        create: {
          email,
          name,
          role: "CUSTOMER",
          passwordHash,
          emailVerified: null,
        },
        update: {
          name,
          passwordHash,
          emailVerified: null,
        },
      });

      await tx.emailVerificationToken.deleteMany({ where: { email } });
      await tx.emailVerificationToken.create({
        data: {
          email,
          tokenHash,
          expiresAt,
        },
      });
    });

    const origin = new URL(req.url).origin;
    const verifyUrl = `${origin}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    const from = process.env.AUTH_FROM_EMAIL || DEFAULT_FROM;
    const html = renderIndustrialEmail({
      preheader: "Verify your DTK account",
      title: "Verify Your DTK Account",
      subtitle: `Hi ${name}, confirm your email to activate your account.`,
      sections: [
        {
          heading: "Account Security",
          bodyHtml:
            '<p style="margin:0;color:#334155;font-size:14px;line-height:1.5;">This link expires in 24 hours. If you did not request this signup, you can ignore this email.</p>',
        },
      ],
      cta: { label: "Verify Email", href: verifyUrl },
    });

    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: "Verify your DTK account",
      html,
      text: [
        `Hi ${name},`,
        "",
        "Please verify your email to activate your DTK account:",
        verifyUrl,
        "",
        "This link expires in 24 hours.",
      ].join("\n"),
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message || "Failed to send verification email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
