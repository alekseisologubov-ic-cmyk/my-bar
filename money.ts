import { closeDayAction } from "@/app/actions/closing";
import { requireManager } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { getTodayStats } from "@/lib/reports";

export default async function ClosingPage({
  searchParams,
}: {
  searchParams: Promise<{ closed?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await requireManager();
  const stats = await getTodayStats(user.venueId);
  const currency = user.venue.currency;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Daily closing</h1>
        <p className="mt-1 text-slate-500">Count cash, review totals, and close the business day.</p>
      </div>

      {params.closed ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          Day closed successfully.
        </div>
      ) : null}
      {params.error === "open-tabs" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          Cannot close the day while open tabs exist.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-500">Total sales</p>
          <p className="mt-2 text-2xl font-black">{formatMoney(stats.totalSales, currency)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-500">Cash expected</p>
          <p className="mt-2 text-2xl font-black">{formatMoney(stats.cashTotal, currency)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-500">Card</p>
          <p className="mt-2 text-2xl font-black">{formatMoney(stats.cardTotal, currency)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-500">Mobile</p>
          <p className="mt-2 text-2xl font-black">{formatMoney(stats.mobileTotal, currency)}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="card p-5">
          <h2 className="text-xl font-black">Closing summary</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-3 font-bold text-slate-500">Orders today</td>
                  <td className="p-3 text-right font-black">{stats.orders.length}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-3 font-bold text-slate-500">Open tabs</td>
                  <td className="p-3 text-right font-black">{stats.openTabs}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-3 font-bold text-slate-500">Tips</td>
                  <td className="p-3 text-right font-black">{formatMoney(stats.tipsTotal, currency)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-3 font-bold text-slate-500">Discounts</td>
                  <td className="p-3 text-right font-black">{formatMoney(stats.discountsTotal, currency)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-3 font-bold text-slate-500">Refunds</td>
                  <td className="p-3 text-right font-black">{formatMoney(stats.refundsTotal, currency)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-500">Voids</td>
                  <td className="p-3 text-right font-black">{stats.voidsTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-black">Close day</h2>
          <form action={closeDayAction} className="mt-4 space-y-4">
            <div>
              <label className="label" htmlFor="cashCounted">
                Cash counted
              </label>
              <input
                id="cashCounted"
                className="field"
                name="cashCounted"
                type="number"
                min="0"
                step="0.01"
                defaultValue={stats.cashTotal.toFixed(2)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="notes">
                Closing notes
              </label>
              <textarea id="notes" className="field min-h-28" name="notes" placeholder="Cash difference, incidents, notes..." />
            </div>
            <button className="btn w-full" type="submit" disabled={stats.openTabs > 0}>
              Close Day
            </button>
            {stats.openTabs > 0 ? (
              <p className="text-sm font-semibold text-red-700">Close open tabs before closing the day.</p>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  );
}
