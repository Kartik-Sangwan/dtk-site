import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FROM, SALES_EMAIL } from "@/lib/email-defaults";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { renderIndustrialEmail } from "@/lib/email-templates";
import { generateVerificationToken, sha256Hex } from "@/lib/auth-security";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = String(body?.email ?? "").trim().toLowerCase();
    const ip = getClientIp(req);

    const ipLimit = checkRateLimit(`auth:reset:ip:${ip}`, {
      windowMs: 15 * 60 * 1000,
      max: 8,
      blockMs: 20 * 60 * 1000,
    });
    if (!ipLimit.ok) {
      return NextResponse.json(
        { ok: false, error: `Too many reset requests. Try again in ${ipLimit.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const emailLimit = checkRateLimit(`auth:reset:email:${email}`, {
      windowMs: 10 * 1000,
      max: 3,
      blockMs: 10 * 1000,
    });
    if (!emailLimit.ok) {
      return NextResponse.json(
        { ok: false, error: `Too many reset requests for this email. Try again in ${emailLimit.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    if (!user?.email) {
      return NextResponse.json(
        {
          ok: false,
          code: "ACCOUNT_NOT_FOUND",
          error: "Account doesn't exist for this email.",
          redirectTo: `/login?mode=signup&email=${encodeURIComponent(email)}`,
        },
        { status: 404 }
      );
    }

    if (process.env.RESEND_API_KEY) {
      const origin = new URL(req.url).origin;
      const token = generateVerificationToken();
      const tokenHash = sha256Hex(token);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

      await prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.deleteMany({ where: { email } });
        await tx.passwordResetToken.create({
          data: { email, tokenHash, expiresAt },
        });
      });

      const resetUrl = `${origin}/auth/reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
      const html = renderIndustrialEmail({
        preheader: "Password reset request received",
        title: "Password Reset Request",
        subtitle: `Hi ${user.name || "there"}, use the secure link below to reset your DTK account password.`,
        sections: [
          {
            heading: "Reset Link",
            bodyHtml:
              '<p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;">This link expires in 1 hour. If you did not request this reset, you can ignore this email.</p>',
          },
        ],
        cta: { label: "Reset Password", href: resetUrl },
      });

      await resend.emails.send({
        from: process.env.AUTH_FROM_EMAIL || DEFAULT_FROM,
        to: [user.email],
        subject: "Reset your DTK account password",
        html,
        replyTo: SALES_EMAIL,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Reset password email sent.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Something went wrong." },
      { status: 500 }
    );
  }
}
