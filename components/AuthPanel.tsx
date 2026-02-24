"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

type Mode = "signin" | "signup";

export default function AuthPanel({
  onAuthSuccess,
  showVerified,
}: {
  onAuthSuccess?: () => void;
  showVerified?: boolean;
}) {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
  const [rememberMe, setRememberMe] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSignInSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/account",
    });

    setBusy(false);

    if (!res || res.error) {
      setErr("Invalid credentials or email not verified yet.");
      return;
    }

    onAuthSuccess?.();
    router.push(res.url || "/account");
  }

  async function onSignUpSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);

    if (signupPassword !== confirmPassword) {
      setBusy(false);
      setErr("Passwords do not match.");
      return;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: signupEmail,
        password: signupPassword,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setBusy(false);

    if (!res.ok || !data?.ok) {
      setErr(data?.error || "Could not create account.");
      return;
    }

    setMsg("Verification email sent. Please check your inbox.");
    setMode("signin");
    setEmail(signupEmail);
    setPassword("");
    setSignupPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-xl md:p-7">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-800">Sign in to your account</h1>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={[
            "rounded-full px-3 py-1.5 font-semibold",
            mode === "signin" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700",
          ].join(" ")}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={[
            "rounded-full px-3 py-1.5 font-semibold",
            mode === "signup" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700",
          ].join(" ")}
        >
          Create account
        </button>
      </div>

      {showVerified && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Email verified successfully. You can sign in now.
        </div>
      )}

      {err && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      )}

      {msg && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {msg}
        </div>
      )}

      {mode === "signin" ? (
        <form onSubmit={onSignInSubmit} className="mt-6 space-y-4">
          <FormField label="Email" value={email} onChange={setEmail} type="email" required />

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800">Password</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSignInPassword((v) => !v)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-100"
                  aria-label={showSignInPassword ? "Hide password" : "Show password"}
                >
                  {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button type="button" className="text-xs font-semibold text-indigo-600 hover:underline">
                  Forgot password?
                </button>
              </div>
            </div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showSignInPassword ? "text" : "password"}
              required
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Remember me
          </label>

          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-lg bg-indigo-500 text-base font-semibold text-white hover:bg-indigo-600 disabled:opacity-60"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      ) : (
        <form onSubmit={onSignUpSubmit} className="mt-6 space-y-4">
          <FormField label="Full Name" value={name} onChange={setName} type="text" required />
          <FormField label="Email" value={signupEmail} onChange={setSignupEmail} type="email" required />
          <FormField
            label="Password"
            value={signupPassword}
            onChange={setSignupPassword}
            type={showSignupPassword ? "text" : "password"}
            required
            hint="At least 8 characters"
            onToggleType={() => setShowSignupPassword((v) => !v)}
            showToggle
            isVisible={showSignupPassword}
          />
          <FormField
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            type={showConfirmPassword ? "text" : "password"}
            required
            onToggleType={() => setShowConfirmPassword((v) => !v)}
            showToggle
            isVisible={showConfirmPassword}
          />

          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-lg bg-indigo-500 text-base font-semibold text-white hover:bg-indigo-600 disabled:opacity-60"
          >
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>
      )}

      <div className="mt-6 flex items-center gap-3 text-slate-500">
        <div className="h-px flex-1 bg-slate-300" />
        <span className="text-xs font-medium">OR</span>
        <div className="h-px flex-1 bg-slate-300" />
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/account" })}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-1.9 3l3 2.3c1.8-1.6 2.8-4 2.8-6.9 0-.7-.1-1.4-.2-2H12z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 5-.9 6.7-2.5l-3-2.3c-.8.6-2 1-3.7 1-2.8 0-5.2-1.9-6.1-4.4l-3.1 2.4C4.5 19.7 8 22 12 22z"
          />
          <path
            fill="#4A90E2"
            d="M5.9 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.3.3-1.8L2.8 7.8C2.3 9 2 10.5 2 12s.3 3 0.8 4.2l3.1-2.4z"
          />
          <path
            fill="#FBBC05"
            d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.9 14.7 2 12 2 8 2 4.5 4.3 2.8 7.8l3.1 2.4c.9-2.5 3.3-4.4 6.1-4.4z"
          />
        </svg>
        Sign in with Google
      </button>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type,
  required,
  hint,
  showToggle = false,
  onToggleType,
  isVisible = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: "text" | "email" | "password";
  required?: boolean;
  hint?: string;
  showToggle?: boolean;
  onToggleType?: () => void;
  isVisible?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-800">{label}</label>
        {showToggle && onToggleType ? (
          <button
            type="button"
            onClick={onToggleType}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-100"
            aria-label={isVisible ? "Hide password" : "Show password"}
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
      />
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}
