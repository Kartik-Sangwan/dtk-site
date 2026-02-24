"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

type CartLine = { partNo: string; qty: number };

type CheckoutSummaryItem = {
  partNo: string;
  name?: string;
  images?: string[];
  qty: number;
  unitPriceCents: number;
};

type CheckoutSummary = {
  currency: "CAD" | "USD" | string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  items: CheckoutSummaryItem[];
};

type Shipping = {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postal: string;
  country: "CA" | "US";
};

type Billing = {
  name?: string;
  company?: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postal: string;
  country: "CA" | "US";
};

type StripeBillingDetails = {
  name?: string;
  email?: string;
  phone?: string;
  address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
};

function moneyFromCents(cents: number, currency: string) {
  return ((cents || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: currency || "CAD",
  });
}

function toErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function friendlyPaymentError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("insufficient") || m.includes("fund")) {
    return "Your card has insufficient funds. Try another card.";
  }
  if (m.includes("declined")) {
    return "Your card was declined. Please use a different card or contact your bank.";
  }
  if (m.includes("expired")) {
    return "Your card appears to be expired. Please check details or use another card.";
  }
  if (m.includes("cvc") || m.includes("security code")) {
    return "The card security code is invalid. Please re-check and try again.";
  }
  if (m.includes("postal") || m.includes("zip")) {
    return "Postal/ZIP verification failed. Please confirm billing details.";
  }
  if (m.includes("network") || m.includes("timeout")) {
    return "Network issue during payment. Check connection and retry.";
  }
  return message || "Payment failed. Please verify details and retry.";
}

function hasValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export default function PlaceOrderClient({
  isLoggedIn,
  initialShipping,
  userEmail,
}: {
  isLoggedIn: boolean;
  initialShipping: Shipping | null;
  userEmail: string;
}) {
  const router = useRouter();

  // --- server cart + summary
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [shipping, setShipping] = useState<Shipping>(
    initialShipping ?? {
      name: "",
      email: userEmail || "",
      company: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      province: "",
      postal: "",
      country: "CA",
    }
  );

  const [saveToProfile, setSaveToProfile] = useState(true);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billing, setBilling] = useState<Billing>({
    name: initialShipping?.name ?? "",
    company: initialShipping?.company ?? "",
    phone: initialShipping?.phone ?? "",
    line1: initialShipping?.line1 ?? "",
    line2: initialShipping?.line2 ?? "",
    city: initialShipping?.city ?? "",
    province: initialShipping?.province ?? "",
    postal: initialShipping?.postal ?? "",
    country: initialShipping?.country ?? "CA",
  });

  // --- Stripe
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null);
  const [stripeBusy, setStripeBusy] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [paymentFailure, setPaymentFailure] = useState<string | null>(null);
  const [paymentRetry, setPaymentRetry] = useState(0);

  const stripeConfirmRef = useRef<
    null | ((opts: { returnUrl: string }) => Promise<{ ok: boolean; error?: string }>)
  >(null);

  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const tRef = useRef<number | null>(null);

  function show(msg: string, tone: "success" | "error" = "success") {
    setToast(msg);
    setToastTone(tone);
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => setToast(null), 2500);
  }

  function retryPayment() {
    setPaymentFailure(null);
    setStripeError(null);
    setStripeClientSecret(null);
    setStripePaymentIntentId(null);
    setPaymentRetry((v) => v + 1);
  }

  const validCountry = shipping.country === "CA" || shipping.country === "US";
  const billingValidCountry = billing.country === "CA" || billing.country === "US";
  const canPlaceShipping =
    validCountry &&
    hasValidPhone(shipping.phone ?? "") &&
    shipping.line1.trim() &&
    shipping.city.trim() &&
    shipping.province.trim() &&
    shipping.postal.trim();
  const canPlaceBilling =
    billingSameAsShipping ||
    (billingValidCountry &&
      billing.line1.trim() &&
      billing.city.trim() &&
      billing.province.trim() &&
      billing.postal.trim());

  // --- Load cart from server cookie cartId
  async function refreshCart() {
    setCartLoading(true);
    setCartError(null);
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const lines: CartLine[] = Array.isArray(data?.cart?.items) ? data.cart.items : [];
      setCartLines(lines);
    } catch (e: unknown) {
      setCartError(toErrorMessage(e, "Failed to load cart"));
      setCartLines([]);
    } finally {
      setCartLoading(false);
    }
  }

  useEffect(() => {
    refreshCart();
  }, []);

  // --- Load priced summary (server-calculated)
  async function refreshSummary(lines: CartLine[]) {
    if (!lines.length) {
      setSummary(null);
      return;
    }
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/checkout/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ items: lines }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setSummary({
        currency: data.currency ?? "CAD",
        subtotalCents: data.subtotalCents ?? 0,
        shippingCents: data.shippingCents ?? 0,
        taxCents: data.taxCents ?? 0,
        totalCents: data.totalCents ?? data.subtotalCents ?? 0,
        items: Array.isArray(data.items) ? data.items : [],
      });
    } catch (e: unknown) {
      setSummary(null);
      show(toErrorMessage(e, "Failed to load totals"), "error");
    } finally {
      setSummaryLoading(false);
    }
  }

  useEffect(() => {
    refreshSummary(cartLines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(cartLines)]);

  const subtotalCents = summary?.subtotalCents ?? 0;
  const shippingCents = summary?.shippingCents ?? 0;
  const taxCents = summary?.taxCents ?? 0;
  const totalCents = summary?.totalCents ?? subtotalCents + shippingCents + taxCents;
  const currency = summary?.currency ?? "CAD";

  const canPlace = canPlaceShipping && canPlaceBilling && cartLines.length > 0 && !!summary;
  const effectiveBilling = useMemo(
    () =>
      billingSameAsShipping
        ? {
            name: shipping.name ?? "",
            company: shipping.company ?? "",
            phone: shipping.phone ?? "",
            line1: shipping.line1,
            line2: shipping.line2 ?? "",
            city: shipping.city,
            province: shipping.province,
            postal: shipping.postal,
            country: shipping.country,
          }
        : billing,
    [billingSameAsShipping, shipping, billing]
  );
  const cartCount = cartLines.length;
  const hasIntent = !!(stripeClientSecret && stripePaymentIntentId);
  const cartPayload = useMemo(
    () => cartLines.map((it) => `${it.partNo}:${it.qty}`).join("|"),
    [cartLines]
  );
  const shippingPayload = useMemo(() => ({ ...shipping }), [shipping]);
  const billingPayload = useMemo(() => ({ ...effectiveBilling }), [effectiveBilling]);
  const stripeBillingDetails: StripeBillingDetails = {
    name: effectiveBilling.name || shipping.name || undefined,
    email: shipping.email || userEmail || undefined,
    phone: effectiveBilling.phone || shipping.phone || undefined,
    address: {
      line1: effectiveBilling.line1 || undefined,
      line2: effectiveBilling.line2 || undefined,
      city: effectiveBilling.city || undefined,
      state: effectiveBilling.province || undefined,
      postal_code: effectiveBilling.postal || undefined,
      country: effectiveBilling.country || undefined,
    },
  };

  // Reset Stripe intent whenever method or subtotal changes
  useEffect(() => {
    setStripeClientSecret(null);
    setStripePaymentIntentId(null);
    setStripeError(null);
    setPaymentFailure(null);
  }, [totalCents]);

  // Create PaymentIntent ONLY when:
  // - Stripe-backed payment selected
  // - shipping is valid
  // - summary is loaded and subtotal > 0
  useEffect(() => {
    let aborted = false;

    async function ensureIntent() {
      if (!canPlace) return;
      if (!totalCents || cartCount === 0) return;
      if (hasIntent) return;

      setStripeBusy(true);
      setStripeError(null);
      try {
        const res = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            amountCents: totalCents,
            currency: String(currency).toLowerCase(),
            cart: cartPayload,
            email: shipping.email || userEmail || undefined,
            shipping: shippingPayload,
            billing: billingPayload,
          }),
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        if (aborted) return;
        setStripeClientSecret(data.clientSecret);
        setStripePaymentIntentId(data.paymentIntentId);
      } catch (e: unknown) {
        if (aborted) return;
        const msg = toErrorMessage(e, "Failed to initialize payment");
        setStripeError(msg);
        setPaymentFailure(friendlyPaymentError(msg));
      } finally {
        if (!aborted) setStripeBusy(false);
      }
    }

    ensureIntent();
    return () => {
      aborted = true;
    };
  }, [
    canPlace,
    totalCents,
    currency,
    paymentRetry,
    cartCount,
    hasIntent,
    cartPayload,
    shippingPayload,
    billingPayload,
    userEmail,
    shipping.email,
  ]);

  async function createOrder(): Promise<string> {
    if (!stripePaymentIntentId) {
      throw new Error("Payment form not ready yet (missing PaymentIntent). Please wait 1–2 seconds and try again.");
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        shipping,
        stripePaymentIntentId: stripePaymentIntentId ?? undefined,
        saveToProfile: isLoggedIn ? saveToProfile : false,
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.orderId as string;
  }

  async function restoreCartAfterFailedPayment(lines: CartLine[]) {
    if (!lines.length) return;
    for (const line of lines) {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "add",
          partNo: line.partNo,
          qty: line.qty,
        }),
      });
    }
    await refreshCart();
  }

  async function placeOrder() {
    if (!canPlace) {
      show(
        "Please complete shipping/billing fields, use a valid 10-digit phone number, and ensure cart has items.",
        "error"
      );
      return;
    }

    setPlacing(true);
    try {
      const cartSnapshot = cartLines.map((line) => ({ ...line }));
      const orderId = await createOrder();

      if (!stripeClientSecret || !stripeConfirmRef.current) {
        show("Payment form not ready yet. Please try again.", "error");
        return;
      }

      const returnUrl = `${window.location.origin}/order/${orderId}`;
      const confirmed = await stripeConfirmRef.current({ returnUrl });

      if (!confirmed.ok) {
        const reason = friendlyPaymentError(confirmed.error ?? "Payment failed");
        setPaymentFailure(reason);
        try {
          await restoreCartAfterFailedPayment(cartSnapshot);
          show(`${reason} Cart restored. You can retry payment.`, "error");
        } catch {
          show(`${reason} Payment failed and cart restore could not complete automatically.`, "error");
        }
        return;
      }

      router.push(`/order/${orderId}`);
    } catch (e: unknown) {
      const msg = toErrorMessage(e, "Failed to place order");
      const reason = friendlyPaymentError(msg);
      setPaymentFailure(reason);
      show(reason, "error");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.85fr]">
      {toast && (
        <div
          className={[
            "fixed right-5 top-20 z-[100] rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg",
            toastTone === "error"
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900",
          ].join(" ")}
        >
          {toast}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="border-b border-slate-200 pb-6">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Contact Information</h2>
          <p className="mt-1 text-sm text-gray-600">Used for order updates and delivery communication.</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field placeholder="Name" value={shipping.name ?? ""} onChange={(v) => setShipping((s) => ({ ...s, name: v }))} />
            <Field placeholder="Email Address *" value={shipping.email ?? ""} onChange={(v) => setShipping((s) => ({ ...s, email: v }))} />
            <Field placeholder="Company (optional)" value={shipping.company ?? ""} onChange={(v) => setShipping((s) => ({ ...s, company: v }))} />
            <Field placeholder="Phone Number *" value={shipping.phone ?? ""} onChange={(v) => setShipping((s) => ({ ...s, phone: v }))} />
          </div>
        </div>

        <div className="border-b border-slate-200 py-6">
          <h3 className="text-3xl font-semibold tracking-tight text-gray-900">Address information</h3>
          <p className="mt-1 text-sm text-gray-600">Canada and USA only.</p>

          <div className="mt-5 grid gap-4">
            <Field placeholder="Street Address *" value={shipping.line1} onChange={(v) => setShipping((s) => ({ ...s, line1: v }))} />
            <Field placeholder="Apt/Suite/Building (optional)" value={shipping.line2 ?? ""} onChange={(v) => setShipping((s) => ({ ...s, line2: v }))} />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field placeholder="City/Town *" value={shipping.city} onChange={(v) => setShipping((s) => ({ ...s, city: v }))} />
            <Field placeholder="Province/State *" value={shipping.province} onChange={(v) => setShipping((s) => ({ ...s, province: v }))} />
            <Field placeholder="Postal/ZIP *" value={shipping.postal} onChange={(v) => setShipping((s) => ({ ...s, postal: v }))} />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <select
                value={shipping.country}
                onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value as "CA" | "US" }))}
                aria-label="Country"
                className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
              >
                <option value="CA">Canada</option>
                <option value="US">United States</option>
              </select>
            </div>

            {isLoggedIn && (
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                  />
                  Save shipping address to my profile
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-slate-200 py-6">
          <h3 className="text-3xl font-semibold tracking-tight text-gray-900">Billing address</h3>
          <div className="mt-3">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
              <input
                type="checkbox"
                checked={billingSameAsShipping}
                onChange={(e) => setBillingSameAsShipping(e.target.checked)}
              />
              Billing same as shipping
            </label>
          </div>

          {!billingSameAsShipping && (
            <>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field
                  placeholder="Billing Name"
                  value={billing.name ?? ""}
                  onChange={(v) => setBilling((b) => ({ ...b, name: v }))}
                />
                <Field
                  placeholder="Billing Company (optional)"
                  value={billing.company ?? ""}
                  onChange={(v) => setBilling((b) => ({ ...b, company: v }))}
                />
              </div>

              <div className="mt-4 grid gap-4">
                <Field
                  placeholder="Billing Street Address *"
                  value={billing.line1}
                  onChange={(v) => setBilling((b) => ({ ...b, line1: v }))}
                />
                <Field
                  placeholder="Billing Apt/Suite/Building (optional)"
                  value={billing.line2 ?? ""}
                  onChange={(v) => setBilling((b) => ({ ...b, line2: v }))}
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Field
                  placeholder="Billing City/Town *"
                  value={billing.city}
                  onChange={(v) => setBilling((b) => ({ ...b, city: v }))}
                />
                <Field
                  placeholder="Billing Province/State *"
                  value={billing.province}
                  onChange={(v) => setBilling((b) => ({ ...b, province: v }))}
                />
                <Field
                  placeholder="Billing Postal/ZIP *"
                  value={billing.postal}
                  onChange={(v) => setBilling((b) => ({ ...b, postal: v }))}
                />
              </div>

              <div className="mt-4 md:max-w-md">
                <select
                  value={billing.country}
                  onChange={(e) => setBilling((b) => ({ ...b, country: e.target.value as "CA" | "US" }))}
                  aria-label="Billing Country"
                  className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
                >
                  <option value="CA">Canada</option>
                  <option value="US">United States</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="pt-6">
          <h3 className="text-3xl font-semibold tracking-tight text-gray-900">Payment</h3>

          <div className="mt-4">
            <div className="h-12 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm leading-[3rem] text-slate-700">
              Credit/Debit card
            </div>
          </div>

          <div className="mt-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                {(!canPlaceShipping || !canPlaceBilling) && (
                  <div className="text-sm text-amber-700">
                    Fill your shipping and billing address above to load payment details.
                  </div>
                )}

                {canPlaceShipping && canPlaceBilling && (!summary || summaryLoading) && (
                  <div className="text-sm text-gray-700">Loading totals…</div>
                )}

                {canPlaceShipping && canPlaceBilling && summary && stripeBusy && (
                  <div className="text-sm text-gray-700">Loading payment form…</div>
                )}

                {canPlaceShipping && canPlaceBilling && stripeError && (
                  <div className="mt-2 text-sm text-red-700">{stripeError}</div>
                )}

                {canPlaceShipping && canPlaceBilling && paymentFailure && (
                  <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                    <div className="text-sm font-semibold text-red-800">Payment issue</div>
                    <div className="mt-1 text-sm text-red-700">{paymentFailure}</div>
                    <button
                      type="button"
                      onClick={retryPayment}
                      className="mt-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      Retry payment
                    </button>
                  </div>
                )}

                {canPlaceShipping && canPlaceBilling && summary && stripeClientSecret && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: stripeClientSecret,
                      appearance: { theme: "stripe" },
                    }}
                  >
                    <StripePanel
                      confirmRef={stripeConfirmRef}
                      billingDetails={stripeBillingDetails}
                    />
                  </Elements>
                )}

                {canPlaceShipping && canPlaceBilling && summary && !stripeBusy && !stripeClientSecret && (
                  <div className="text-sm text-red-700">Unable to load payment form.</div>
                )}
              </div>
          </div>
        </div>

        {cartError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {cartError}
          </div>
        )}

        <button
          type="button"
          onClick={refreshCart}
          className="mt-5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-slate-50"
        >
          Refresh cart
        </button>
      </div>

      <aside className="h-fit rounded-2xl border border-slate-300 bg-slate-100 p-6 shadow-sm lg:sticky lg:top-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-300 pb-4">
          <h2 className="text-4xl font-semibold tracking-tight text-gray-900">Order Summary</h2>
          <div className="text-lg font-semibold text-gray-900">{moneyFromCents(totalCents, currency)}</div>
        </div>

        <button type="button" className="mt-4 text-sm font-semibold text-blue-700 hover:underline">
          + Add promo code
        </button>

        <div className="mt-4 space-y-4 border-t border-slate-300 pt-4">
          {cartLoading && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-gray-700">
              Loading cart…
            </div>
          )}

          {!cartLoading && summary?.items?.map((it) => (
            <div key={it.partNo} className="flex items-start justify-between gap-3 border-b border-slate-300 pb-4">
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-md bg-white">
                  <Image
                    src={it.images?.[0] || "/products/alignment-coupler.png"}
                    alt={it.name || it.partNo}
                    fill
                    className="object-contain p-1"
                    sizes="64px"
                  />
                </div>
                <div>
                  <div className="text-xl font-medium text-gray-900">{it.name || it.partNo}</div>
                  <div className="text-sm text-gray-600">{it.partNo}</div>
                  <div className="mt-3 text-sm text-gray-700">x{it.qty}</div>
                </div>
              </div>
              <div className="pt-1 text-xl font-medium text-gray-900">
                {moneyFromCents(it.unitPriceCents * it.qty, currency)}
              </div>
            </div>
          ))}

          {!cartLoading && cartLines.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-gray-700">
              Your cart is empty.
            </div>
          )}
        </div>

        <div className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Subtotal</span>
            <span className="font-semibold text-gray-900">{moneyFromCents(subtotalCents, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Shipping Fee</span>
            <span className="font-semibold text-gray-900">{moneyFromCents(shippingCents, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Tax</span>
            <span className="font-semibold text-gray-900">{moneyFromCents(taxCents, currency)}</span>
          </div>
          <div className="h-px bg-slate-300 my-2" />
          <div className="flex justify-between text-base">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-xl font-bold text-gray-900">{moneyFromCents(totalCents, currency)}</span>
          </div>
        </div>

        <button
          disabled={!canPlace || placing}
          onClick={placeOrder}
          className={[
            "mt-6 inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-semibold",
            !canPlace || placing
              ? "bg-gray-300 text-gray-600"
              : "bg-gray-900 text-white hover:bg-gray-800",
          ].join(" ")}
        >
          {placing ? "Placing order..." : "Place Order"}
        </button>

        <div className="mt-3 text-xs text-gray-600">
          By placing your order, you agree orders ship to Canada/USA only.
        </div>

      </aside>
    </div>
  );
}

function Field({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={placeholder.replace("*", "").trim()}
      placeholder={placeholder}
      className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
    />
  );
}

function StripePanel({
  confirmRef,
  billingDetails,
}: {
  confirmRef: MutableRefObject<
    null | ((opts: { returnUrl: string }) => Promise<{ ok: boolean; error?: string }>)
  >;
  billingDetails: StripeBillingDetails;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const stripeRef = useRef(stripe);
  const elementsRef = useRef(elements);
  const billingRef = useRef(billingDetails);

  useEffect(() => {
    stripeRef.current = stripe;
    elementsRef.current = elements;
    billingRef.current = billingDetails;
  }, [stripe, elements, billingDetails]);

  useEffect(() => {
    confirmRef.current = async ({ returnUrl }) => {
      const currentStripe = stripeRef.current;
      const currentElements = elementsRef.current;
      if (!currentStripe || !currentElements) return { ok: false, error: "Stripe not ready" };
      const { error } = await currentStripe.confirmPayment({
        elements: currentElements,
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: { billing_details: billingRef.current },
        },
        redirect: "if_required",
      });
      return error ? { ok: false, error: error.message } : { ok: true };
    };
    return () => {
      confirmRef.current = null;
    };
  }, [confirmRef]);

  return (
    <div>
      <div className="text-sm font-semibold text-gray-900">Card details</div>
      <p className="mt-1 text-xs text-gray-600">Enter credit/debit card details below.</p>
      <div className="mt-3">
        <PaymentElement options={{ layout: "accordion" }} />
      </div>
    </div>
  );
}
