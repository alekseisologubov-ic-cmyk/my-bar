import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { getTodayStats } from "@/lib/reports";

export default async function DashboardPage() {
  const user = await requireUser();
  const stats = await getTodayStats(user.venueId);
  const currency = user.venue.currency;

  const kpis = [
    { label: "Today's sales", value: formatMoney(stats.totalSales, currency) },
    { label: "Cash", value: formatMoney(stats.cashTotal, currency) },
    { label: "Card", value: formatMoney(stats.cardTotal, currency) },
    { label: "Mobile", value: formatMoney(stats.mobileTotal, currency) },
    { label: "Tips", value: formatMoney(stats.tipsTotal, currency) },
    { label: "Open tabs", value: stats.openTabs.toString() },
    { label: "Discounts", value: formatMoney(stats.discountsTotal, currency) },
    { label: "Refunds", value: formatMoney(stats.refundsTotal, currency) },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-white md:flex-row md:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-slate-300">POS MVP</p>
          <h1 className="mt-2 text-3xl font-black">Today at {user.venue.name}</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Start with menu setup, then create paid POS orders and close the day.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/pos" className="btn bg-white text-slate-900">
            Open POS
          </Link>
          <Link href="/menu" className="btn-secondary">
            Menu setup
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <p className="text-sm font-bold text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-black">{kpi.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-xl font-black">Latest orders</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Staff</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.orders.slice(0, 8).map((order) => (
                  <tr key={order.id} className="border-t border-slate-200">
                    <td className="p-3 font-bold">#{order.orderNumber}</td>
                    <td className="p-3">{order.staffUser.name}</td>
                    <td className="p-3">{order.payments[0]?.method ?? "-"}</td>
                    <td className="p-3 text-right font-bold">{formatMoney(order.total, currency)}</td>
                  </tr>
                ))}
                {stats.orders.length === 0 ? (
                  <tr>
                    <td className="p-4 text-slate-500" colSpan={4}>
                      No orders yet today.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-black">Next build steps</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-700">
            <li>Create staff accounts and permissions.</li>
            <li>Add multi-item carts and open tabs.</li>
            <li>Add discounts, voids, and refunds with manager approval.</li>
            <li>Add inventory recipes and automatic stock deduction.</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
