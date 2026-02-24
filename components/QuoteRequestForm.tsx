"use client";

import { FormEvent, useState } from "react";

export default function QuoteRequestForm({
  initialPartNo = "",
}: {
  initialPartNo?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [partNo, setPartNo] = useState(initialPartNo);
  const [qty, setQty] = useState("1");
  const [needBy, setNeedBy] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);

    try {
      const res = await fetch("/api/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, partNo, qty, needBy, notes }),
      });

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErr(data.error || "Could not send quote request.");
        return;
      }

      setMsg("Quote request sent. Our team will get back to you shortly.");
      setNotes("");
      if (!initialPartNo) setPartNo("");
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Could not send quote request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm md:p-6">
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--steel-900)]">Request a Quote</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Send part details and target quantity for pricing and lead time.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field placeholder="Name *" value={name} onChange={setName} required />
        <Field placeholder="Email *" type="email" value={email} onChange={setEmail} required />
        <Field placeholder="Company" value={company} onChange={setCompany} />
        <Field placeholder="Part Number *" value={partNo} onChange={setPartNo} required />
        <Field placeholder="Quantity *" value={qty} onChange={setQty} required />
        <Field placeholder="Need By" type="date" value={needBy} onChange={setNeedBy} />
      </div>

      <div className="mt-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          aria-label="Notes"
          className="min-h-[110px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
          placeholder="Material, thread, delivery constraints, shipping location..."
        />
      </div>

      {err && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{err}</div>}
      {msg && <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{msg}</div>}

      <button
        type="submit"
        disabled={busy}
        className={[
          "mt-5 inline-flex rounded-md px-4 py-2 text-sm font-semibold",
          busy ? "bg-slate-300 text-slate-600" : "bg-slate-900 text-white hover:bg-slate-800",
        ].join(" ")}
      >
        {busy ? "Sending..." : "Send Quote Request"}
      </button>
    </form>
  );
}

function Field({
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "date";
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      aria-label={placeholder.replace("*", "").trim()}
      placeholder={type === "date" ? undefined : placeholder}
      className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
    />
  );
}
