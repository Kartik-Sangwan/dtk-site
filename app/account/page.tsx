import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import AccountProfileForm, { type AccountProfile } from "@/components/AccountForm";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      name: true,
      email: true,
      image: true,
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

  const initialProfile: AccountProfile = {
    name: user?.name ?? session.user.name ?? "",
    email: user?.email ?? session.user.email,
    image: user?.image ?? session.user.image ?? "",
    company: user?.address?.company ?? "",
    phone: user?.address?.phone ?? "",
    shippingAddress1: user?.address?.line1 ?? "",
    shippingAddress2: user?.address?.line2 ?? "",
    city: user?.address?.city ?? "",
    province: user?.address?.province ?? "",
    postalCode: user?.address?.postalCode ?? "",
    country: user?.address?.country ?? "",
  };

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account</h1>
            <p className="mt-2 text-gray-700">
              Signed in as <span className="font-semibold">{initialProfile.email}</span>
            </p>
          </div>

          <Link
            href="/account/orders"
            className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-slate-50"
          >
            View Order Status
          </Link>
        </div>

        <AccountProfileForm initialProfile={initialProfile} />
      </section>
    </main>
  );
}
