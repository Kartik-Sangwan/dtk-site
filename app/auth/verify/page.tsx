import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { sha256Hex } from "@/lib/auth-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VerifyStatus = "success" | "invalid" | "expired" | "already";

async function verifyEmailToken(email: string, token: string): Promise<VerifyStatus> {
  const normalizedEmail = email.trim().toLowerCase();
  const tokenHash = sha256Hex(token);

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, email: true, expiresAt: true, consumedAt: true },
  });

  if (!record || record.email !== normalizedEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { emailVerified: true },
    });
    return existingUser?.emailVerified ? "already" : "invalid";
  }

  if (record.consumedAt) return "already";

  if (record.expiresAt.getTime() < Date.now()) {
    return "expired";
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.updateMany({
      where: { email: normalizedEmail },
      data: { emailVerified: new Date() },
    });

    await tx.emailVerificationToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });

    await tx.emailVerificationToken.deleteMany({
      where: { email: normalizedEmail, id: { not: record.id } },
    });
  });

  return "success";
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token ? String(sp.token) : "";
  const email = sp.email ? String(sp.email) : "";

  let status: VerifyStatus = "invalid";
  if (token && email) {
    status = await verifyEmailToken(email, token);
  }

  const content: Record<VerifyStatus, { title: string; body: string }> = {
    success: {
      title: "Email verified",
      body: "Your account is active now. You can sign in with your email and password.",
    },
    already: {
      title: "Already verified",
      body: "This email is already verified. You can sign in now.",
    },
    expired: {
      title: "Verification link expired",
      body: "Request a new verification email from the sign-up form.",
    },
    invalid: {
      title: "Invalid verification link",
      body: "The link is not valid. Request a new verification email from sign up.",
    },
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-2xl border border-slate-300 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-gray-900">{content[status].title}</h1>
          <p className="mt-3 text-sm text-gray-700">{content[status].body}</p>

          <Link
            href={status === "success" || status === "already" ? "/login?verified=1" : "/login"}
            className="mt-6 inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Go to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
