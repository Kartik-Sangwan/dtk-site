"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ShoppingCart, X } from "lucide-react";
import { CART_SERVER_EVENT } from "@/lib/cart-client";
import AuthModal from "@/components/AuthModal";

type CartRes = {
  ok: boolean;
  cart?: { id: string; items: { partNo: string; qty: number }[] };
};

const primaryLinks = [
  { href: "/products", label: "Products" },
  { href: "/resources", label: "Resources" },
  { href: "/inventory", label: "Inventory" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/feedback", label: "Feedback" },
] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [authModalSyncKey, setAuthModalSyncKey] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isStaff = role === "ADMIN" || role === "OPS" || role === "SALES";
  const onLoginPage = pathname === "/login";

  const openSignIn = () => {
    setMobileMenuOpen(false);
    if (onLoginPage) {
      const email =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("email")
          : null;
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
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-300/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
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

        <nav className="hidden items-center gap-6 text-sm md:flex">
          {primaryLinks.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                className={
                  active
                    ? "font-semibold text-gray-950"
                    : "text-gray-700 transition-colors hover:text-gray-950"
                }
                href={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
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
                className="hidden sm:inline-flex rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={openSignIn}
              className="hidden sm:inline-flex rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Sign in
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-site-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-900 transition-colors hover:bg-slate-50 md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <nav
          id="mobile-site-menu"
          className="border-t border-slate-300/70 bg-white shadow-[0_18px_34px_rgba(15,23,32,0.08)] md:hidden"
        >
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="grid gap-2">
            {primaryLinks.map((link) => {
              const active = isActivePath(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={
                    active
                      ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                      : "rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-white hover:text-slate-950"
                  }
                >
                  {link.label}
                </Link>
              );
            })}

            {session?.user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className={
                    isActivePath(pathname, "/account")
                      ? "rounded-xl border border-orange-600 bg-orange-500 px-4 py-3 text-sm font-semibold text-white"
                      : "rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-950"
                  }
                >
                  Account
                </Link>
                {isStaff ? (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={
                      isActivePath(pathname, "/admin")
                        ? "rounded-xl border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                        : "rounded-xl border border-slate-400 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900"
                    }
                  >
                    Admin
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="rounded-xl bg-gray-900 px-4 py-3 text-left text-sm font-semibold text-white"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={openSignIn}
                className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-left text-sm font-semibold text-orange-950"
              >
                Sign in
              </button>
            )}
          </div>
          </div>
        </nav>
      ) : null}

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        syncKey={authModalSyncKey}
      />
    </header>
  );
}
