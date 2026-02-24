import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("avatar");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
  }
  if (!ALLOWED[file.type]) {
    return NextResponse.json(
      { error: "Only JPG, PNG, and WEBP images are allowed." },
      { status: 400 }
    );
  }
  if (file.size <= 0 || file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image must be between 1 byte and 5MB." },
      { status: 400 }
    );
  }

  const ext = ALLOWED[file.type];
  const fileName = `${randomUUID()}${ext}`;
  const relPath = `/uploads/avatars/${fileName}`;
  const fullPath = path.join(process.cwd(), "public", relPath);

  await mkdir(path.dirname(fullPath), { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(fullPath, Buffer.from(bytes));

  await prisma.user.update({
    where: { email },
    data: { image: relPath },
  });

  return NextResponse.json({ ok: true, imageUrl: relPath });
}

export async function DELETE() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { image: true },
  });

  if (user?.image && user.image.startsWith("/uploads/avatars/")) {
    const fullPath = path.join(process.cwd(), "public", user.image);
    await unlink(fullPath).catch(() => {
      // ignore if file doesn't exist
    });
  }

  await prisma.user.update({
    where: { email },
    data: { image: null },
  });

  return NextResponse.json({ ok: true });
}
