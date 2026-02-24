import { prisma } from "@/lib/prisma";
import { updateOrderStatusAction } from "./actions";

const STATUS_OPTIONS = [
  "AWAITING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "FULFILLED",
  "CANCELLED",
] as const;

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "CAD",
  }).format((cents || 0) / 100);
}

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      items: { select: { id: true, partNo: true, qty: true, price: true } },
    },
  });

  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Orders</h2>
          <p className="mt-1 text-sm text-slate-600">Latest 200 orders. Update fulfillment status from here.</p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[1100px] w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="px-3 py-2 font-semibold text-slate-700">Order</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Date</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Customer</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Items</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Total</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Current</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Update</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const shippingCents = Math.round(order.subtotal * 0.1);
              const totalCents = order.subtotal + shippingCents;
              const itemCount = order.items.reduce((sum, it) => sum + it.qty, 0);
              const label = order.publicRef || order.id;
              return (
                <tr key={order.id} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-900">{label}</div>
                    <div className="text-xs text-slate-500">{order.id}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{order.createdAt.toLocaleString()}</td>
                  <td className="px-3 py-3 text-slate-700">
                    <div>{order.shipName || "-"}</div>
                    <div className="text-xs text-slate-500">{order.shipEmail || "-"}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    <div>{itemCount} items</div>
                    <div className="text-xs text-slate-500">{order.items.map((it) => it.partNo).join(", ")}</div>
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-900">
                    {money(totalCents, order.currency)}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <form action={updateOrderStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="orderId" value={order.id} />
                      <select
                        name="status"
                        defaultValue={order.status}
                        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 outline-none focus:border-slate-500"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
