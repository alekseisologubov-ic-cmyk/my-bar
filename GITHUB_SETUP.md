import prisma from "@/lib/prisma";
import { toNumber } from "@/lib/money";

export function getBusinessDayRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export async function getTodayStats(venueId: string) {
  const { start, end } = getBusinessDayRange();

  const orders = await prisma.order.findMany({
    where: {
      venueId,
      closedAt: { gte: start, lt: end },
    },
    include: {
      payments: true,
      tips: true,
      discounts: true,
      refunds: true,
      voids: true,
      items: true,
      staffUser: true,
      table: true,
    },
    orderBy: { closedAt: "desc" },
  });

  const openTabs = await prisma.order.count({
    where: { venueId, status: "OPEN" },
  });

  let totalSales = 0;
  let cashTotal = 0;
  let cardTotal = 0;
  let mobileTotal = 0;
  let tipsTotal = 0;
  let discountsTotal = 0;
  let refundsTotal = 0;
  let voidsTotal = 0;

  for (const order of orders) {
    if (order.status === "PAID") {
      totalSales += toNumber(order.total);
    }

    for (const payment of order.payments) {
      if (payment.status !== "RECORDED") continue;
      if (payment.method === "CASH") cashTotal += toNumber(payment.amount);
      if (payment.method === "CARD") cardTotal += toNumber(payment.amount);
      if (payment.method === "MOBILE") mobileTotal += toNumber(payment.amount);
    }

    for (const tip of order.tips) tipsTotal += toNumber(tip.amount);
    for (const discount of order.discounts) discountsTotal += toNumber(discount.amount);
    for (const refund of order.refunds) refundsTotal += toNumber(refund.amount);
    voidsTotal += order.voids.length;
  }

  return {
    businessDate: start,
    orders,
    openTabs,
    totalSales,
    cashTotal,
    cardTotal,
    mobileTotal,
    tipsTotal,
    discountsTotal,
    refundsTotal,
    voidsTotal,
  };
}
