"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getStaffActor } from "@/lib/admin";
import type { OrderStatus } from "@prisma/client";

const ALLOWED_STATUSES: OrderStatus[] = [
  "AWAITING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "FULFILLED",
  "CANCELLED",
];

function parseStatus(value: string): OrderStatus | null {
  return ALLOWED_STATUSES.find((status) => status === value) ?? null;
}

export async function updateOrderStatusAction(formData: FormData) {
  const actor = await getStaffActor();
  if (!actor) throw new Error("Unauthorized");

  const orderId = String(formData.get("orderId") ?? "");
  const nextStatusRaw = String(formData.get("status") ?? "");
  const nextStatus = parseStatus(nextStatusRaw);
  if (!orderId || !nextStatus) throw new Error("Invalid order status update payload");

  await prisma.order.update({
    where: { id: orderId },
    data: { status: nextStatus },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
  revalidatePath(`/order/${orderId}`);
}
