"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { CART_SERVER_EVENT } from "@/lib/cart-client";
import AuthModal from "@/components/AuthModal";

type CartRes = {
  ok: boolean;
  cart?: { id: string; items: { partNo: string; qty: number }[] };
};

function useCartCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as CartRes;
      const items = data?.cart?.items ?? [];
      const n = items.reduce((s, it) => s + (it.qty || 0), 0);
      setCount(n);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void refresh();
    }, 0);

    const onUpdate = () => refresh();
    const onFocus = () => refresh();
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener(CART_SERVER_EVENT, onUpdate as EventListener);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.clearTimeout(initial);
      window.removeEventListener(CART_SERVER_EVENT, onUpdate as EventListener);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  return count;
}

export default function Header() {
  const { data: session, status } = useSession();
  const count = useCartCount();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [authModalSyncKey, setAuthModalSyncKey] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isStaff = role === "ADMIN" || role === "OPS" || role === "SALES";
  const onLoginPage = pathname === "/login";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-300/70 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/dtk-logo-final-removebg-preview.png"
            alt="DTK Industrial Components"
            width={140}
            height={44}
            className="h-10 w-auto"
            priority
          />
          <div className="hidden sm:block">
            <div className="text-base font-semibold leading-tight text-gray-900">
              DTK Industrial
            </div>
            <div className="text-sm text-gray-600 leading-tight">
              Cylinder Accessories • NFPA • ISO
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link className="text-gray-700 hover:text-gray-900" href="/products">
            Products
          </Link>
          <Link className="text-gray-700 hover:text-gray-900" href="/resources">
            Resources
          </Link>
          <Link className="text-gray-700 hover:text-gray-900" href="/inventory">
            Inventory
          </Link>
          <Link className="text-gray-700 hover:text-gray-900" href="/about">
            About
          </Link>
          <Link className="text-gray-700 hover:text-gray-900" href="/contact">
            Contact
          </Link>
          <Link className="text-gray-700 hover:text-gray-900" href="/feedback">
            Feedback
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Cart */}
          <Link
            href="/checkout"
            className="relative inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-slate-50"
            aria-label="Cart"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Cart</span>

            {count > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-900 px-1.5 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {/* Auth */}
          {status === "loading" ? (
            <div className="h-9 w-24 rounded-md bg-slate-200 animate-pulse" />
          ) : session?.user ? (
            <>
              {isStaff && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex items-center gap-2 rounded-md border border-slate-300 bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/account"
                className="hidden sm:inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-slate-50"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full"
                  />
                ) : null}
                Account
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onLoginPage) {
                  const email = searchParams.get("email");
                  router.push(
                    email
                      ? `/login?mode=signin&email=${encodeURIComponent(email)}`
                      : "/login?mode=signin"
                  );
                  return;
                }
                setAuthModalMode("signin");
                setAuthModalSyncKey((v) => v + 1);
                setShowAuthModal(true);
              }}
              className="inline-flex rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        syncKey={authModalSyncKey}
      />
    </header>
  );
}
