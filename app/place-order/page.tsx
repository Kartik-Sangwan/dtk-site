import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PlaceOrderClient from "@/components/PlaceOrderClient";
import { BASE_SHIPPING_RATE, SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY, TAX_RATE } from "@/lib/business";

type InitialShipping = {
  name: string;
  email: string;
  company: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postal: string;
  country: "CA" | "US";
};

export default async function PlaceOrderPage() {
  const session = await auth();

  let initialShipping: InitialShipping | null = null;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        name: true,
        email: true,
        address: {
          select: {
            company: true,
            phone: true,
            line1: true,
            line2: true,
            city: true,
            province: true,
            postalCode: true,
            country: true,
          },
        },
      },
    });

    const a = user?.address;
    if (a?.line1) {
      initialShipping = {
        name: user?.name ?? "",
        email: user?.email ?? session.user.email ?? "",
        company: a.company ?? "",
        phone: a.phone ?? "",
        line1: a.line1 ?? "",
        line2: a.line2 ?? "",
        city: a.city ?? "",
        province: a.province ?? "",
        postal: a.postalCode ?? "",
        country: a.country === "US" ? "US" : "CA",
      };
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-5xl font-semibold tracking-tight text-gray-900">Checkout</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">1 Shipping</span>
          <span>›</span>
          <span>2 Payment</span>
          <span>›</span>
          <span>3 Review</span>
        </div>
        <p className="mt-3 text-sm text-gray-700">
          Shipping available to <span className="font-semibold">Canada</span> and{" "}
          <span className="font-semibold">USA</span>.
        </p>
        <p className="mt-2 text-sm text-gray-700">
          Shipping {Math.round(BASE_SHIPPING_RATE * 100)}% of subtotal, tax {Math.round(TAX_RATE * 100)}% of subtotal.
          Questions: <span className="font-semibold">{SUPPORT_EMAIL}</span> |{" "}
          <span className="font-semibold">{SUPPORT_PHONE_DISPLAY}</span>.
        </p>

        <PlaceOrderClient
          isLoggedIn={!!session?.user?.email}
          initialShipping={initialShipping}
          userEmail={session?.user?.email ?? ""}
        />
      </section>
    </main>
  );
}
