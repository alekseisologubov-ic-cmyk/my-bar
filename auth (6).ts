import prisma from "@/lib/prisma";
import { requireManager } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { getTodayStats } from "@/lib/reports";

export default async function ReportsPage() {
  const user = await requireManager();
  const stats = await getTodayStats(user.venueId);
  const currency = user.venue.currency;

  const [closings, topItems] = await Promise.all([
    prisma.dailyClosing.findMany({
      where: { venueId: user.venueId },
      include: { closedBy: true },
      orderBy: { closedAt: "desc" },
      take: 10,
    }),
    prisma.orderItem.groupBy({
      by: ["nameSnapshot"],
      where: { order: { venueId: user.venueId, status: "PAID" } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Reports</h1>
        <p className="mt-1 text-slate-500">First MVP reports: sales, payments, tips, items, and closings.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-500">Today sales</p>
          <p className="mt-2 text-2xl font-black">{formatMoney(stats.totalSales, currency)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-500">Today tips</p>
          <p className="mt-2 text-2xl font-black">{formatMoney(stats.tipsTotal, currency)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-500">Orders today</p>
          <p className="mt-2 text-2xl font-black">{stats.orders.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-500">Open tabs</p>
          <p className="mt-2 text-2xl font-black">{stats.openTabs}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-xl font-black">Sales by payment method</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-3 font-bold">Cash</td>
                  <td className="p-3 text-right font-black">{formatMoney(stats.cashTotal, currency)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-3 font-bold">Card</td>
                  <td className="p-3 text-right font-black">{formatMoney(stats.cardTotal, currency)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">Mobile</td>
                  <td className="p-3 text-right font-black">{formatMoney(stats.mobileTotal, currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-black">Top sold items</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Sales</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item) => (
                  <tr key={item.nameSnapshot} className="border-t border-slate-200">
                    <td className="p-3 font-bold">{item.nameSnapshot}</td>
                    <td className="p-3 text-right">{item._sum.quantity ?? 0}</td>
                    <td className="p-3 text-right font-black">{formatMoney(item._sum.lineTotal ?? 0, currency)}</td>
                  </tr>
                ))}
                {topItems.length === 0 ? (
                  <tr>
                    <td className="p-4 text-slate-500" colSpan={3}>
                      No item sales yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-black">Daily closings</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Closed by</th>
                <th className="p-3 text-right">Sales</th>
                <th className="p-3 text-right">Cash diff</th>
              </tr>
            </thead>
            <tbody>
              {closings.map((closing) => (
                <tr key={closing.id} className="border-t border-slate-200">
                  <td className="p-3 font-bold">{closing.businessDate.toLocaleDateString()}</td>
                  <td className="p-3">{closing.closedBy.name}</td>
                  <td className="p-3 text-right font-black">{formatMoney(closing.totalSales, currency)}</td>
                  <td className="p-3 text-right font-black">{formatMoney(closing.cashDifference, currency)}</td>
                </tr>
              ))}
              {closings.length === 0 ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={4}>
                    No daily closings yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
