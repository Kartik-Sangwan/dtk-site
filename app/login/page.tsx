"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import AuthPanel from "@/components/AuthPanel";

export default function LoginPage() {
  const params = useSearchParams();
  const verified = useMemo(() => params.get("verified") === "1", [params]);
  const initialMode = useMemo(() => {
    const mode = params.get("mode");
    return mode === "signup" ? "signup" : "signin";
  }, [params]);
  const initialEmail = useMemo(() => params.get("email") ?? "", [params]);
  const initialName = useMemo(() => params.get("name") ?? "", [params]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <AuthPanel
            showVerified={verified}
            initialMode={initialMode}
            initialEmail={initialEmail}
            initialName={initialName}
          />
        </div>
      </section>
    </main>
  );
}
