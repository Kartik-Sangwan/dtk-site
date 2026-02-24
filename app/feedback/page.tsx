"use client";

import Image from "next/image";
import { useState } from "react";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setErr("Please enter a valid 10-digit phone number.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, comment }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(data?.error || "Failed to submit.");
        return;
      }

      setMsg("Thanks! Your message has been sent.");
      setName("");
      setEmail("");
      setPhone("");
      setComment("");
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden border-b border-slate-300 bg-slate-900">
        <div className="absolute inset-0">
          <Image
            src="/images/site/contact-hero.jpg"
            alt="Industrial service desk"
            fill
            className="object-cover opacity-35"
            sizes="100vw"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/70 to-slate-900/35" />
        <div className="relative mx-auto max-w-6xl px-6 py-14">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Feedback</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
            Share product requests, support issues, and procurement feedback. Our team reviews every
            submission.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm md:p-8"
          >
            <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Submit Feedback</p>
              <p className="text-xs text-slate-500">All fields required</p>
            </div>

            <div className="grid gap-4">
              <input
                aria-label="Name"
                className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name *"
              />

              <input
                aria-label="Email"
                className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address *"
                type="email"
              />

              <input
                aria-label="Phone"
                className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number *"
                type="tel"
                pattern="^(?:\\D*\\d){10}\\D*$"
                title="Enter 10 digits (formatting like dashes/spaces is fine)."
              />

              <textarea
                aria-label="Comment"
                className="min-h-[140px] w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comment *"
              />

              {err && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {err}
                </div>
              )}
              {msg && (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  {msg}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={[
                    "rounded-md px-4 py-2 text-sm font-semibold",
                    loading
                      ? "bg-gray-300 text-gray-600"
                      : "bg-gray-900 text-white hover:bg-gray-800",
                  ].join(" ")}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </form>

          <aside className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
            <div className="relative h-56 w-full">
              <Image
                src="/images/site/proc-2.jpg"
                alt="Manufacturing process"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 33vw, 100vw"
              />
            </div>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">What to Include</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li>Part number and product family when available.</li>
                <li>Expected quantity and required timeline.</li>
                <li>Any issue details with photos or order references.</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
