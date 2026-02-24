"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const email = useMemo(() => params.get("email") ?? "", [params]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !email) {
      setError("Reset link is missing required parameters.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data?.ok) {
        setError(data?.error || "Could not reset password.");
        return;
      }
      setSuccess("Password reset successful. Redirecting to sign in...");
      window.setTimeout(() => {
        router.push(`/login?mode=signin&email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch {
      setError("Could not reset password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-6 shadow-xl md:p-7">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-800">Reset your password</h1>
          <p className="mt-2 text-sm text-slate-600">{email || "Missing email"}</p>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800">New Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-100"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                required
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800">Confirm Password</label>
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-100"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showConfirm ? "text" : "password"}
                required
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="h-12 w-full rounded-lg bg-slate-900 text-base font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {busy ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <Link
            href="/login?mode=signin"
            className="mt-5 inline-flex text-sm font-semibold text-indigo-600 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
