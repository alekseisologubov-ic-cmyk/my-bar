"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { decimalString, toNumber } from "@/lib/money";

export async function createPaidOrderAction(formData: FormData) {
  const user = await requireUser();

  const menuItemId = String(formData.get("menuItemId") ?? "");
  const tableIdRaw = String(formData.get("tableId") ?? "");
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1));
  const paymentMethod = String(formData.get("paymentMethod") ?? "CASH");
  const tipAmount = decimalString(formData.get("tipAmount"));
  const notes = String(formData.get("notes") ?? "").trim();

  if (!menuItemId) redirect("/pos?error=no-item");
  if (!["CASH", "CARD", "MOBILE"].includes(paymentMethod)) redirect("/pos?error=bad-payment");

  const menuItem = await prisma.menuItem.findFirst({
    where: { id: menuItemId, venueId: user.venueId, isActive: true },
  });

  if (!menuItem) redirect("/pos?error=item-not-found");

  const tableId = tableIdRaw || null;
  if (tableId) {
    const table = await prisma.venueTable.findFirst({ where: { id: tableId, venueId: user.venueId } });
    if (!table) redirect("/pos?error=table-not-found");
  }

  const unitPrice = toNumber(menuItem.price);
  const subtotal = unitPrice * quantity;
  const total = subtotal;

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        venueId: user.venueId,
        tableId,
        staffUserId: user.id,
        status: "PAID",
        subtotal: subtotal.toFixed(2),
        discountTotal: "0.00",
        taxTotal: "0.00",
        total: total.toFixed(2),
        notes: notes || null,
        closedAt: new Date(),
        items: {
          create: {
            menuItemId: menuItem.id,
            nameSnapshot: menuItem.name,
            priceSnapshot: unitPrice.toFixed(2),
            quantity,
            lineTotal: subtotal.toFixed(2),
            notes: notes || null,
          },
        },
      },
    });

    const payment = await tx.payment.create({
      data: {
        orderId: createdOrder.id,
        method: paymentMethod as "CASH" | "CARD" | "MOBILE",
        amount: total.toFixed(2),
      },
    });

    if (Number(tipAmount) > 0) {
      await tx.tip.create({
        data: {
          orderId: createdOrder.id,
          paymentId: payment.id,
          staffUserId: user.id,
          amount: tipAmount,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        venueId: user.venueId,
        userId: user.id,
        action: "CREATE_PAID_ORDER",
        entityType: "Order",
        entityId: createdOrder.id,
        newValue: {
          menuItem: menuItem.name,
          quantity,
          paymentMethod,
          total: total.toFixed(2),
          tipAmount,
        },
      },
    });

    return createdOrder;
  });

  revalidatePath("/");
  revalidatePath("/pos");
  revalidatePath("/reports");
  redirect(`/pos?success=${order.orderNumber}`);
}
