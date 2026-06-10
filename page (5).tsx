import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { createPaidOrderAction } from "@/app/actions/pos";

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  const [categories, tables, recentOrders] = await Promise.all([
    prisma.menuCategory.findMany({
      where: { venueId: user.venueId, isActive: true },
      include: { items: { where: { isActive: true }, orderBy: { name: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.venueTable.findMany({
      where: { venueId: user.venueId },
      orderBy: { name: "asc" },
    }),
    prisma.order.findMany({
      where: { venueId: user.venueId },
      include: { staffUser: true, payments: true, items: true, table: true },
      orderBy: { openedAt: "desc" },
      take: 10,
    }),
  ]);

  const itemCount = categories.reduce((total, category) => total + category.items.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">POS</h1>
        <p className="mt-1 text-slate-500">Create a simple paid order. Multi-item cart comes next.</p>
      </div>

      {params.success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          Order #{params.success} was created.
        </div>
      ) : null}
      {params.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          Error: {params.error}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="card p-5">
          <h2 className="text-xl font-black">New paid order</h2>
          {itemCount === 0 ? (
            <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              Add menu items before creating POS orders.
            </p>
          ) : (
            <form action={createPaidOrderAction} className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label" htmlFor="menuItemId">
                  Item
                </label>
                <select id="menuItemId" className="field" name="menuItemId" required>
                  <option value="">Select item</option>
                  {categories.map((category) => (
                    <optgroup key={category.id} label={category.name}>
                      {category.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} - {formatMoney(item.price, user.venue.currency)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="quantity">
                  Quantity
                </label>
                <input id="quantity" className="field" name="quantity" type="number" min="1" defaultValue="1" required />
              </div>

              <div>
                <label className="label" htmlFor="tableId">
                  Table / bar tab
                </label>
                <select id="tableId" className="field" name="tableId">
                  <option value="">No table</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="paymentMethod">
                  Payment
                </label>
                <select id="paymentMethod" className="field" name="paymentMethod" defaultValue="CARD">
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="MOBILE">Mobile Pay</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="tipAmount">
                  Tip amount
                </label>
                <input id="tipAmount" className="field" name="tipAmount" type="number" min="0" step="0.01" defaultValue="0.00" />
              </div>

              <div className="md:col-span-2">
                <label className="label" htmlFor="notes">
                  Notes
                </label>
                <input id="notes" className="field" name="notes" placeholder="No ice, birthday table, etc." />
              </div>

              <div className="md:col-span-2">
                <button className="btn" type="submit">
                  Create paid order
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-black">Menu quick view</h2>
          <div className="mt-4 max-h-[580px] space-y-4 overflow-auto pr-1">
            {categories.map((category) => (
              <div key={category.id}>
                <h3 className="font-black text-slate-500">{category.name}</h3>
                <div className="mt-2 grid gap-2">
                  {category.items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold">{item.name}</p>
                        <p className="font-black">{formatMoney(item.price, user.venue.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-black">Recent orders</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Item</th>
                <th className="p-3">Table</th>
                <th className="p-3">Staff</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-slate-200">
                  <td className="p-3 font-bold">#{order.orderNumber}</td>
                  <td className="p-3">{order.items.map((item) => item.nameSnapshot).join(", ")}</td>
                  <td className="p-3">{order.table?.name ?? "-"}</td>
                  <td className="p-3">{order.staffUser.name}</td>
                  <td className="p-3">{order.status}</td>
                  <td className="p-3 text-right font-bold">{formatMoney(order.total, user.venue.currency)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={6}>
                    No orders yet.
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
