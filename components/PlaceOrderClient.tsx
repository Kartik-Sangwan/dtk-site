"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  ExpressCheckoutElement,
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

function moneyFromCents(cents: number, currency: string) {
  return ((cents || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: currency || "CAD",
  });
}

function toErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
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

  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "PAYPAL" | "INTERAC">("STRIPE");
  const [saveToProfile, setSaveToProfile] = useState(true);

  // --- Stripe
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null);
  const [stripeBusy, setStripeBusy] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const stripeConfirmRef = useRef<
    null | ((opts: { returnUrl: string }) => Promise<{ ok: boolean; error?: string }>)
  >(null);

  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const tRef = useRef<number | null>(null);

  function show(msg: string) {
    setToast(msg);
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => setToast(null), 2500);
  }

  const needsStripe = paymentMethod === "STRIPE" || paymentMethod === "PAYPAL";

  const validCountry = shipping.country === "CA" || shipping.country === "US";
  const canPlaceShipping =
    validCountry &&
    shipping.line1.trim() &&
    shipping.city.trim() &&
    shipping.province.trim() &&
    shipping.postal.trim();

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
      show(toErrorMessage(e, "Failed to load totals"));
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

  const canPlace = canPlaceShipping && cartLines.length > 0 && !!summary;

  // Reset Stripe intent whenever method or subtotal changes
  useEffect(() => {
    setStripeClientSecret(null);
    setStripePaymentIntentId(null);
    setStripeError(null);
  }, [paymentMethod, totalCents]);

  // Create PaymentIntent ONLY when:
  // - Stripe-backed payment selected
  // - shipping is valid
  // - summary is loaded and subtotal > 0
  useEffect(() => {
    let aborted = false;

    async function ensureIntent() {
      if (!needsStripe) return;
      if (!canPlaceShipping) return;
      if (!summary) return;
      if (!totalCents || cartLines.length === 0) return;
      if (stripeClientSecret && stripePaymentIntentId) return;

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
            cart: cartLines.map((it) => `${it.partNo}:${it.qty}`).join("|"),
            email: shipping.email || userEmail || undefined,
          }),
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        if (aborted) return;
        setStripeClientSecret(data.clientSecret);
        setStripePaymentIntentId(data.paymentIntentId);
      } catch (e: unknown) {
        if (aborted) return;
        setStripeError(toErrorMessage(e, "Failed to initialize payment"));
      } finally {
        if (!aborted) setStripeBusy(false);
      }
    }

    ensureIntent();
    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsStripe, canPlaceShipping, totalCents, currency, summary, JSON.stringify(cartLines)]);

  async function createOrder(): Promise<string> {
    // IMPORTANT: For STRIPE/PAYPAL, block until we have the PaymentIntent ID.
    if ((paymentMethod === "STRIPE" || paymentMethod === "PAYPAL") && !stripePaymentIntentId) {
      throw new Error("Payment form not ready yet (missing PaymentIntent). Please wait 1–2 seconds and try again.");
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        shipping,
        paymentMethod,
        stripePaymentIntentId: stripePaymentIntentId ?? undefined,
        saveToProfile: isLoggedIn ? saveToProfile : false,
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.orderId as string;
  }

  async function placeOrder() {
    if (!canPlace) {
      show("Please complete shipping (Canada/USA) and ensure cart has items.");
      return;
    }

    setPlacing(true);
    try {
      const orderId = await createOrder();

      if (paymentMethod === "STRIPE" || paymentMethod === "PAYPAL") {
        if (!stripeClientSecret || !stripeConfirmRef.current) {
          show("Payment form not ready yet. Please try again.");
          return;
        }

        const returnUrl = `${window.location.origin}/order/${orderId}`;
        const confirmed = await stripeConfirmRef.current({ returnUrl });

        if (!confirmed.ok) {
          show(confirmed.error ?? "Payment failed");
          return;
        }

        router.push(`/order/${orderId}`);
        return;
      }

      if (paymentMethod === "INTERAC") {
        router.push(`/order/${orderId}?method=interac`);
        return;
      }

      router.push(`/order/${orderId}`);
    } catch (e: unknown) {
      show(toErrorMessage(e, "Failed to place order"));
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.85fr]">
      {toast && (
        <div className="fixed right-5 top-20 z-[100] rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-lg">
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

        <div className="pt-6">
          <h3 className="text-3xl font-semibold tracking-tight text-gray-900">Payment</h3>

          <div className="mt-4">
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as "STRIPE" | "PAYPAL" | "INTERAC")
              }
              aria-label="Payment method"
              className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="STRIPE">Credit/Debit card (Stripe)</option>
              <option value="PAYPAL">Apple Pay / Google Pay / PayPal (Express)</option>
              <option value="INTERAC">Interac e-Transfer (manual)</option>
            </select>
            <p className="mt-2 text-xs text-gray-600">
              Apple Pay / Google Pay / PayPal buttons appear only on supported devices/browsers and if enabled in Stripe.
            </p>
          </div>

          <div className="mt-4">
            {(paymentMethod === "STRIPE" || paymentMethod === "PAYPAL") && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                {!canPlaceShipping && (
                  <div className="text-sm text-amber-700">
                    Fill your shipping address above to load payment details.
                  </div>
                )}

                {canPlaceShipping && (!summary || summaryLoading) && (
                  <div className="text-sm text-gray-700">Loading totals…</div>
                )}

                {canPlaceShipping && summary && stripeBusy && (
                  <div className="text-sm text-gray-700">Loading payment form…</div>
                )}

                {canPlaceShipping && stripeError && (
                  <div className="mt-2 text-sm text-red-700">{stripeError}</div>
                )}

                {canPlaceShipping && summary && stripeClientSecret && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: stripeClientSecret,
                      appearance: { theme: "stripe" },
                    }}
                  >
                    <StripePanel
                      method={paymentMethod}
                      confirmRef={stripeConfirmRef}
                      createOrder={createOrder}
                      setStripeError={setStripeError}
                    />
                  </Elements>
                )}

                {canPlaceShipping && summary && !stripeBusy && !stripeClientSecret && (
                  <div className="text-sm text-red-700">Unable to load payment form.</div>
                )}
              </div>
            )}

            {paymentMethod === "INTERAC" && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-gray-700">
                  You’ll place the order first. Then we’ll show e-Transfer instructions (recipient + reference).
                </div>
              </div>
            )}
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
          disabled={!canPlace || placing || paymentMethod === "PAYPAL"}
          onClick={placeOrder}
          className={[
            "mt-6 inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-semibold",
            !canPlace || placing || paymentMethod === "PAYPAL"
              ? "bg-gray-300 text-gray-600"
              : "bg-gray-900 text-white hover:bg-gray-800",
          ].join(" ")}
        >
          {placing ? "Placing order..." : paymentMethod === "PAYPAL" ? "Use Express Checkout below" : "Place Order"}
        </button>

        <div className="mt-3 text-xs text-gray-600">
          By placing your order, you agree orders ship to Canada/USA only.
        </div>

        {paymentMethod === "PAYPAL" && (
          <div className="mt-2 text-xs text-gray-600">
            Complete payment using the Apple Pay / Google Pay / PayPal buttons in the payment section.
          </div>
        )}
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
  method,
  confirmRef,
  createOrder,
  setStripeError,
}: {
  method: "STRIPE" | "PAYPAL";
  confirmRef: MutableRefObject<
    null | ((opts: { returnUrl: string }) => Promise<{ ok: boolean; error?: string }>)
  >;
  createOrder: () => Promise<string>;
  setStripeError: (msg: string | null) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (method !== "STRIPE") {
      confirmRef.current = null;
      return;
    }
    confirmRef.current = async ({ returnUrl }) => {
      if (!stripe || !elements) return { ok: false, error: "Stripe not ready" };
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: "if_required",
      });
      return error ? { ok: false, error: error.message } : { ok: true };
    };
    return () => {
      confirmRef.current = null;
    };
  }, [stripe, elements, confirmRef, method]);

  if (method === "PAYPAL") {
    return (
      <div>
        <div className="text-sm font-semibold text-gray-900">Express checkout</div>
        <p className="mt-1 text-xs text-gray-600">
          Shows Apple Pay / Google Pay / PayPal buttons when available on your device and enabled in Stripe.
        </p>
        <div className="mt-3">
          <ExpressCheckoutElement
            onConfirm={async (event) => {
              if (!stripe || !elements) {
                event.paymentFailed({ reason: "fail" });
                return;
              }

              try {
                const orderId = await createOrder();
                const returnUrl = `${window.location.origin}/order/${orderId}`;

                const { error } = await stripe.confirmPayment({
                  elements,
                  confirmParams: { return_url: returnUrl },
                  redirect: "if_required",
                });

                if (error) {
                  event.paymentFailed({ reason: "fail" });
                  setStripeError(error.message ?? "Payment failed");
                  return;
                }
              } catch (e: unknown) {
                event.paymentFailed({ reason: "fail" });
                setStripeError(toErrorMessage(e, "Payment failed"));
              }
            }}
          />
        </div>
        <div className="mt-3 text-xs text-gray-600">
          Note: Redirect-based methods (like PayPal) will take the customer away and return to your site.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm font-semibold text-gray-900">Card details</div>
      <p className="mt-1 text-xs text-gray-600">
        Enter credit/debit card details below. Apple Pay / Google Pay can be offered via Express Checkout.
      </p>
      <div className="mt-3">
        <PaymentElement options={{ layout: "accordion" }} />
      </div>
    </div>
  );
}
