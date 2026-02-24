import { NextResponse } from "next/server";
import { DEFAULT_FROM, SALES_EMAIL } from "@/lib/email-defaults";
import { Resend } from "resend";
import { escapeHtml, renderFieldGrid, renderIndustrialEmail } from "@/lib/email-templates";

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
      company?: string;
      partNo?: string;
      qty?: string;
      needBy?: string;
      notes?: string;
    };

    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const company = String(body?.company ?? "").trim();
    const partNo = String(body?.partNo ?? "").trim();
    const qty = String(body?.qty ?? "").trim();
    const needBy = String(body?.needBy ?? "").trim();
    const notes = String(body?.notes ?? "").trim();

    if (!name || !email || !partNo || !qty) {
      return NextResponse.json(
        { ok: false, error: "Please provide name, email, part number, and quantity." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Quote email service is not configured." },
        { status: 500 }
      );
    }

    const to = process.env.QUOTE_TO_EMAIL || process.env.FEEDBACK_TO_EMAIL || SALES_EMAIL;
    const from = process.env.AUTH_FROM_EMAIL || DEFAULT_FROM;

    const subject = `Quote Request: ${partNo} (${qty})`;
    const text = [
      "New quote request",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Company: ${company || "-"}`,
      `Part Number: ${partNo}`,
      `Quantity: ${qty}`,
      `Need By: ${needBy || "-"}`,
      "",
      "Notes:",
      notes || "-",
    ].join("\n");
    const html = renderIndustrialEmail({
      preheader: `Quote request for ${partNo}`,
      title: "New Quote Request",
      subtitle: "A customer requested pricing and lead time.",
      sections: [
        {
          heading: "Request Details",
          bodyHtml: renderFieldGrid([
            { label: "Part Number", value: partNo },
            { label: "Quantity", value: qty },
            { label: "Need By", value: needBy || "-" },
          ]),
        },
        {
          heading: "Customer",
          bodyHtml: renderFieldGrid([
            { label: "Name", value: name },
            { label: "Email", value: email },
            { label: "Company", value: company || "-" },
          ]),
        },
        {
          heading: "Notes",
          bodyHtml: `<p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(notes || "-")}</p>`,
        },
      ],
    });

    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      replyTo: email,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message || "Failed to send quote request." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Something went wrong." },
      { status: 500 }
    );
  }
}
