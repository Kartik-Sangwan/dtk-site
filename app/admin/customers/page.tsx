import { prisma } from "@/lib/prisma";

export default async function AdminCustomersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
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
      orders: {
        select: {
          id: true,
          status: true,
          subtotal: true,
          currency: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Customer Profiles</h2>
      <p className="mt-1 text-sm text-slate-600">Latest 200 user profiles with role, address, and recent orders.</p>

      <div className="mt-4 space-y-3">
        {users.map((user) => (
          <article key={user.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-slate-900">{user.name || "-"}</p>
                <p className="text-sm text-slate-600">{user.email || "-"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {user.role}
                </span>
                <span className="text-xs text-slate-500">Joined {user.createdAt.toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</p>
                <p className="mt-1 text-sm text-slate-700">
                  {user.address?.company ? `${user.address.company}\n` : ""}
                  {user.address?.line1 || "-"}
                  {user.address?.line2 ? `, ${user.address.line2}` : ""}
                  <br />
                  {user.address?.city || "-"}, {user.address?.province || "-"} {user.address?.postalCode || "-"}
                  <br />
                  {user.address?.country || "-"}
                </p>
                <p className="mt-1 text-sm text-slate-600">Phone: {user.address?.phone || "-"}</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent Orders</p>
                {user.orders.length === 0 ? (
                  <p className="mt-1 text-sm text-slate-600">No orders yet.</p>
                ) : (
                  <ul className="mt-1 space-y-1 text-sm text-slate-700">
                    {user.orders.slice(0, 3).map((order) => (
                      <li key={order.id}>
                        {order.createdAt.toLocaleDateString()} | {order.status}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
