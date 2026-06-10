"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireManager } from "@/lib/auth";
import { decimalString } from "@/lib/money";
import { getTodayStats } from "@/lib/reports";

export async function closeDayAction(formData: FormData) {
  const user = await requireManager();
  const stats = await getTodayStats(user.venueId);

  if (stats.openTabs > 0) {
    redirect("/closing?error=open-tabs");
  }

  const cashCounted = Number(decimalString(formData.get("cashCounted")));
  const cashDifference = cashCounted - stats.cashTotal;
  const notes = String(formData.get("notes") ?? "").trim();

  const closing = await prisma.dailyClosing.upsert({
    where: {
      venueId_businessDate: {
        venueId: user.venueId,
        businessDate: stats.businessDate,
      },
    },
    update: {
      totalSales: stats.totalSales.toFixed(2),
      cashExpected: stats.cashTotal.toFixed(2),
      cashCounted: cashCounted.toFixed(2),
      cashDifference: cashDifference.toFixed(2),
      cardTotal: stats.cardTotal.toFixed(2),
      mobileTotal: stats.mobileTotal.toFixed(2),
      tipsTotal: stats.tipsTotal.toFixed(2),
      refundsTotal: stats.refundsTotal.toFixed(2),
      voidsTotal: stats.voidsTotal.toFixed(2),
      discountsTotal: stats.discountsTotal.toFixed(2),
      notes: notes || null,
      closedByUserId: user.id,
      closedAt: new Date(),
    },
    create: {
      venueId: user.venueId,
      businessDate: stats.businessDate,
      totalSales: stats.totalSales.toFixed(2),
      cashExpected: stats.cashTotal.toFixed(2),
      cashCounted: cashCounted.toFixed(2),
      cashDifference: cashDifference.toFixed(2),
      cardTotal: stats.cardTotal.toFixed(2),
      mobileTotal: stats.mobileTotal.toFixed(2),
      tipsTotal: stats.tipsTotal.toFixed(2),
      refundsTotal: stats.refundsTotal.toFixed(2),
      voidsTotal: stats.voidsTotal.toFixed(2),
      discountsTotal: stats.discountsTotal.toFixed(2),
      notes: notes || null,
      closedByUserId: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      venueId: user.venueId,
      userId: user.id,
      action: "CLOSE_DAY",
      entityType: "DailyClosing",
      entityId: closing.id,
      newValue: {
        totalSales: stats.totalSales.toFixed(2),
        cashExpected: stats.cashTotal.toFixed(2),
        cashCounted: cashCounted.toFixed(2),
        cashDifference: cashDifference.toFixed(2),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/closing");
  revalidatePath("/reports");
  redirect("/closing?closed=1");
}
