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
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const comment = String(body?.comment ?? "").trim();

    if (!name || !email || !phone || !comment) {
      return NextResponse.json(
        { ok: false, error: "Please fill out all fields." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email." },
        { status: 400 }
      );
    }

    const to = process.env.FEEDBACK_TO_EMAIL || SALES_EMAIL;

    // NOTE: Resend requires a verified "from" domain/email.
    // For initial testing, you can use: "onboarding@resend.dev"
    const from = process.env.AUTH_FROM_EMAIL || DEFAULT_FROM;

    const subject = `DTK Feedback: ${name}`;

    const text = [
      `New Feedback Submission`,
      ``,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      ``,
      `Comment:`,
      comment,
      ``,
      `---`,
      `Sent from /feedback`,
    ].join("\n");
    const html = renderIndustrialEmail({
      preheader: `Feedback from ${name}`,
      title: "New Feedback Submission",
      subtitle: "A customer submitted feedback from the website.",
      sections: [
        {
          heading: "Contact",
          bodyHtml: renderFieldGrid([
            { label: "Name", value: name },
            { label: "Email", value: email },
            { label: "Phone", value: phone },
          ]),
        },
        {
          heading: "Comment",
          bodyHtml: `<p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(comment)}</p>`,
        },
      ],
    });

    
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      replyTo: email, // so you can hit reply in Gmail
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message || "Email failed to send." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Something went wrong." },
      { status: 500 }
    );
  }
}
