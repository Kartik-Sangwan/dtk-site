import { BUSINESS_FOOTER_NOTE } from "@/lib/business";

type EmailSection = {
  heading?: string;
  bodyHtml: string;
};

type IndustrialEmailOptions = {
  preheader?: string;
  title: string;
  subtitle?: string;
  sections?: EmailSection[];
  cta?: { label: string; href: string };
  footerNote?: string;
};

function getLogoUrl() {
  const explicit = process.env.EMAIL_LOGO_URL?.trim();
  if (explicit) return explicit;

  // Temporary public logo host for local/dev email rendering.
  const githubFallback =
    "https://raw.githubusercontent.com/Kartik-Sangwan/temp-logo/main/dtk-logo-final.jpg";

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    "https://dtkindustrial.com";
  const normalized = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  return process.env.NODE_ENV === "development"
    ? githubFallback
    : `${normalized}/dtk-final-logo.jpg`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderFieldGrid(
  fields: Array<{ label: string; value: string }>
): string {
  const rows = fields
    .map(
      (field) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#475569;font-size:13px;font-weight:600;letter-spacing:0.02em;">
          ${escapeHtml(field.label)}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;text-align:right;">
          ${escapeHtml(field.value)}
        </td>
      </tr>`
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      ${rows}
    </table>
  `;
}

export function renderIndustrialEmail(opts: IndustrialEmailOptions): string {
  const logoSrc = getLogoUrl();
  const preheader = escapeHtml(opts.preheader || opts.title);
  const subtitle = opts.subtitle ? `<p style="margin:10px 0 0;color:#334155;font-size:14px;line-height:1.5;">${escapeHtml(opts.subtitle)}</p>` : "";

  const sections = (opts.sections || [])
    .map((section) => {
      const heading = section.heading
        ? `<h3 style="margin:0 0 10px;color:#0f172a;font-size:15px;letter-spacing:0.02em;text-transform:uppercase;">${escapeHtml(section.heading)}</h3>`
        : "";
      return `
        <section style="margin-top:16px;padding:16px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;">
          ${heading}
          ${section.bodyHtml}
        </section>
      `;
    })
    .join("");

  const cta = opts.cta
    ? `
      <div style="margin-top:20px;">
        <a href="${opts.cta.href}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:11px 16px;border-radius:8px;font-weight:700;font-size:14px;">
          ${escapeHtml(opts.cta.label)}
        </a>
      </div>
    `
    : "";

  const footer = escapeHtml(
    opts.footerNote || BUSINESS_FOOTER_NOTE
  );

  return `
  <!doctype html>
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(opts.title)}</title>
    </head>
    <body style="margin:0;padding:0;background:#e2e8f0;font-family:Arial,Helvetica,sans-serif;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:700px;background:#ffffff;border:1px solid #94a3b8;border-radius:14px;overflow:hidden;">
              <tr>
                <td style="padding:18px 24px;background:#e2e8f0;border-bottom:4px solid #f59e0b;">
                  <img
                    src="${logoSrc}"
                    alt="DTK Industrial"
                    width="170"
                    style="display:block;height:auto;max-width:170px;margin:0 0 8px;"
                  />
                  <div style="margin-top:6px;color:#334155;font-size:12px;">
                    Production-ready hardware for hydraulic and pneumatic cylinders
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <h1 style="margin:0;color:#0f172a;font-size:24px;line-height:1.25;">${escapeHtml(opts.title)}</h1>
                  ${subtitle}
                  ${sections}
                  ${cta}
                  <p style="margin:20px 0 0;color:#64748b;font-size:12px;line-height:1.5;">${footer}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}
