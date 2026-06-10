"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type View = "dashboard" | "pos" | "menu" | "reports" | "closing";
type PaymentMethod = "cash" | "card" | "mobile";
type OrderStatus = "paid" | "voided";

type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  active: boolean;
};

type CartLine = {
  itemId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  number: number;
  createdAt: string;
  items: CartLine[];
  subtotal: number;
  discount: number;
  tip: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
};

type ClosingRecord = {
  id: string;
  date: string;
  closedAt: string;
  totalSales: number;
  cashExpected: number;
  cashCounted: number;
  cashDifference: number;
  cardTotal: number;
  mobileTotal: number;
  tipsTotal: number;
  ordersCount: number;
  notes: string;
};

const STORAGE_KEY = "my-bar-pos-v1";

const DEFAULT_MENU: MenuItem[] = [
  { id: "beer-draft", name: "Draft Beer", category: "Beer", price: 5.5, active: true },
  { id: "beer-bottle", name: "Bottle Beer", category: "Beer", price: 6.0, active: true },
  { id: "mojito", name: "Mojito", category: "Cocktails", price: 9.5, active: true },
  { id: "old-fashioned", name: "Old Fashioned", category: "Cocktails", price: 11.0, active: true },
  { id: "vodka-soda", name: "Vodka Soda", category: "Spirits", price: 8.0, active: true },
  { id: "cola", name: "Cola", category: "Soft Drinks", price: 3.0, active: true },
  { id: "water", name: "Sparkling Water", category: "Soft Drinks", price: 2.8, active: true },
  { id: "fries", name: "Fries", category: "Food", price: 5.0, active: true },
  { id: "burger", name: "Burger", category: "Food", price: 13.0, active: true }
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function money(value: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR"
  }).format(Number.isFinite(value) ? value : 0);
}

function paymentLabel(method: PaymentMethod) {
  if (method === "cash") return "Cash";
  if (method === "card") return "Card";
  return "Mobile Pay";
}

export default function HomePage() {
  const [loaded, setLoaded] = useState(false);
  const [activeView, setActiveView] = useState<View>("dashboard");

  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [closings, setClosings] = useState<ClosingRecord[]>([]);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [tip, setTip] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [cashCounted, setCashCounted] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const [newItem, setNewItem] = useState({
    name: "",
    category: "Cocktails",
    price: ""
  });

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          menuItems?: MenuItem[];
          orders?: Order[];
          closings?: ClosingRecord[];
        };

        if (parsed.menuItems) setMenuItems(parsed.menuItems);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.closings) setClosings(parsed.closings);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        menuItems,
        orders,
        closings
      })
    );
  }, [loaded, menuItems, orders, closings]);

  const categories = useMemo(() => {
    const names = new Set<string>();

    menuItems.forEach((item) => names.add(item.category));
    orders.forEach((order) => {
      order.items.forEach((item) => names.add(item.category));
    });

    return ["All", ...Array.from(names).sort()];
  }, [menuItems, orders]);

  const activeMenuItems = useMemo(() => {
    return menuItems
      .filter((item) => item.active)
      .filter((item) => selectedCategory === "All" || item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  }, [cart]);

  const discountAmount = Math.min(Math.max(Number(discount) || 0, 0), cartSubtotal);
  const tipAmount = Math.max(Number(tip) || 0, 0);
  const cartTotal = Math.max(cartSubtotal - discountAmount + tipAmount, 0);

  const todayOrders = useMemo(() => {
    const today = todayKey();
    return orders.filter((order) => order.createdAt.slice(0, 10) === today);
  }, [orders]);

  const paidTodayOrders = todayOrders.filter((order) => order.status === "paid");

  const todayStats = useMemo(() => {
    const totalSales = paidTodayOrders.reduce((sum, order) => sum + order.total, 0);
    const cashTotal = paidTodayOrders
      .filter((order) => order.paymentMethod === "cash")
      .reduce((sum, order) => sum + order.total, 0);
    const cardTotal = paidTodayOrders
      .filter((order) => order.paymentMethod === "card")
      .reduce((sum, order) => sum + order.total, 0);
    const mobileTotal = paidTodayOrders
      .filter((order) => order.paymentMethod === "mobile")
      .reduce((sum, order) => sum + order.total, 0);
    const tipsTotal = paidTodayOrders.reduce((sum, order) => sum + order.tip, 0);
    const discountsTotal = paidTodayOrders.reduce((sum, order) => sum + order.discount, 0);
    const voidsCount = todayOrders.filter((order) => order.status === "voided").length;

    return {
      totalSales,
      cashTotal,
      cardTotal,
      mobileTotal,
      tipsTotal,
      discountsTotal,
      ordersCount: paidTodayOrders.length,
      voidsCount
    };
  }, [paidTodayOrders, todayOrders]);

  const categorySales = useMemo(() => {
    const names = Array.from(new Set(menuItems.map((item) => item.category))).sort();

    return names
      .map((category) => {
        const total = paidTodayOrders.reduce((orderSum, order) => {
          const itemTotal = order.items
            .filter((item) => item.category === category)
            .reduce((lineSum, item) => lineSum + item.price * item.quantity, 0);

          return orderSum + itemTotal;
        }, 0);

        return { category, total };
      })
      .filter((row) => row.total > 0);
  }, [menuItems, paidTodayOrders]);

  function addToCart(item: MenuItem) {
    setCart((current) => {
      const existing = current.find((line) => line.itemId === item.id);

      if (existing) {
        return current.map((line) =>
          line.itemId === item.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }

      return [
        ...current,
        {
          itemId: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: 1
        }
      ];
    });
  }

  function updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((current) => current.filter((line) => line.itemId !== itemId));
      return;
    }

    setCart((current) =>
      current.map((line) => (line.itemId === itemId ? { ...line, quantity } : line))
    );
  }

  function completeSale() {
    if (cart.length === 0) {
      window.alert("Add at least one item to the cart first.");
      return;
    }

    const order: Order = {
      id: makeId("order"),
      number: orders.length + 1,
      createdAt: new Date().toISOString(),
      items: cart,
      subtotal: cartSubtotal,
      discount: discountAmount,
      tip: tipAmount,
      total: cartTotal,
      paymentMethod,
      status: "paid"
    };

    setOrders((current) => [order, ...current]);
    setCart([]);
    setTip("0");
    setDiscount("0");
    window.alert(`Order #${order.number} paid by ${paymentLabel(paymentMethod)}.`);
  }

  function voidOrder(orderId: string) {
    const approved = window.confirm("Void this order? This keeps the record but removes it from paid sales.");
    if (!approved) return;

    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: "voided" } : order))
    );
  }

  function addMenuItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const price = Number(newItem.price);

    if (!newItem.name.trim()) {
      window.alert("Enter an item name.");
      return;
    }

    if (!newItem.category.trim()) {
      window.alert("Enter a category.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      window.alert("Enter a valid price.");
      return;
    }

    setMenuItems((current) => [
      ...current,
      {
        id: makeId("item"),
        name: newItem.name.trim(),
        category: newItem.category.trim(),
        price,
        active: true
      }
    ]);

    setNewItem({
      name: "",
      category: newItem.category,
      price: ""
    });
  }

  function toggleMenuItem(itemId: string) {
    setMenuItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, active: !item.active } : item))
    );
  }

  function closeDay() {
    const counted = Number(cashCounted);

    if (!Number.isFinite(counted)) {
      window.alert("Enter the counted cash amount.");
      return;
    }

    const record: ClosingRecord = {
      id: makeId("closing"),
      date: todayKey(),
      closedAt: new Date().toISOString(),
      totalSales: todayStats.totalSales,
      cashExpected: todayStats.cashTotal,
      cashCounted: counted,
      cashDifference: counted - todayStats.cashTotal,
      cardTotal: todayStats.cardTotal,
      mobileTotal: todayStats.mobileTotal,
      tipsTotal: todayStats.tipsTotal,
      ordersCount: todayStats.ordersCount,
      notes: closingNotes
    };

    setClosings((current) => [record, ...current]);
    setCashCounted("");
    setClosingNotes("");
    window.alert("Day closed and saved.");
  }

  function resetDemoData() {
    const approved = window.confirm("Reset all local demo data? This will remove orders, closings, and custom menu items.");
    if (!approved) return;

    setMenuItems(DEFAULT_MENU);
    setOrders([]);
    setClosings([]);
    setCart([]);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  if (!loaded) {
    return (
      <main className="container">
        <div className="card">Loading My Bar POS...</div>
      </main>
    );
  }

  const navItems: { key: View; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "pos", label: "POS" },
    { key: "menu", label: "Menu" },
    { key: "reports", label: "Reports" },
    { key: "closing", label: "Daily Closing" }
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-top">
            <div>
              <div className="logo">My Bar POS</div>
              <div className="subtitle">Sales, payments, tips, menu setup, reports, and daily closing</div>
            </div>
            <div className="badge">Phase 1 MVP</div>
          </div>

          <nav className="nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveView(item.key)}
                className={activeView === item.key ? "active" : ""}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container">
        <section className="grid grid-4">
          <div className="card">
            <div className="kpi-label">Today sales</div>
            <div className="kpi-value">{money(todayStats.totalSales)}</div>
          </div>
          <div className="card">
            <div className="kpi-label">Orders</div>
            <div className="kpi-value">{todayStats.ordersCount}</div>
          </div>
          <div className="card">
            <div className="kpi-label">Tips</div>
            <div className="kpi-value">{money(todayStats.tipsTotal)}</div>
          </div>
          <div className="card">
            <div className="kpi-label">Cash expected</div>
            <div className="kpi-value">{money(todayStats.cashTotal)}</div>
          </div>
        </section>

        {activeView === "dashboard" && (
          <section className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card dark">
              <h1 className="title">Today at My Bar</h1>
              <p>
                Start by creating menu items, then use the POS to record sales. At the end of the
                day, count cash and save the daily closing.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
                <button className="primary" type="button" onClick={() => setActiveView("pos")}>
                  Open POS
                </button>
                <button className="secondary" type="button" onClick={() => setActiveView("menu")}>
                  Edit Menu
                </button>
              </div>
            </div>

            <div className="card">
              <h2 className="title">Launch roadmap</h2>
              <div className="report-line">
                <span>Phase 1</span>
                <strong>POS demo on Vercel</strong>
              </div>
              <div className="report-line">
                <span>Phase 2</span>
                <strong>Supabase database</strong>
              </div>
              <div className="report-line">
                <span>Phase 3</span>
                <strong>Login and staff roles</strong>
              </div>
              <div className="report-line">
                <span>Phase 4</span>
                <strong>Inventory and stock</strong>
              </div>
            </div>

            <div className="card">
              <h2 className="title">Payment totals</h2>
              <div className="report-line">
                <span>Cash</span>
                <strong>{money(todayStats.cashTotal)}</strong>
              </div>
              <div className="report-line">
                <span>Card</span>
                <strong>{money(todayStats.cardTotal)}</strong>
              </div>
              <div className="report-line">
                <span>Mobile Pay</span>
                <strong>{money(todayStats.mobileTotal)}</strong>
              </div>
            </div>

            <div className="card">
              <h2 className="title">Controls</h2>
              <p className="muted">
                This first launch stores data in this browser only. After Vercel launch, we connect
                a real database so all staff share the same live data.
              </p>
              <button className="danger" type="button" onClick={resetDemoData} style={{ marginTop: 16 }}>
                Reset demo data
              </button>
            </div>
          </section>
        )}

        {activeView === "pos" && (
          <section className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2 className="title">POS</h2>

              <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <div className="grid grid-3" style={{ marginTop: 16 }}>
                {activeMenuItems.map((item) => (
                  <button key={item.id} type="button" className="menu-button" onClick={() => addToCart(item)}>
                    <div className="menu-name">{item.name}</div>
                    <div className="menu-meta">{item.category}</div>
                    <div className="price">{money(item.price)}</div>
                  </button>
                ))}
              </div>

              {activeMenuItems.length === 0 && (
                <p className="muted" style={{ marginTop: 16 }}>
                  No active menu items in this category.
                </p>
              )}
            </div>

            <div className="card">
              <h2 className="title">Current Order</h2>

              {cart.length === 0 && <p className="muted">Cart is empty. Add items from the POS menu.</p>}

              {cart.map((line) => (
                <div key={line.itemId} className="cart-line">
                  <div>
                    <strong>{line.name}</strong>
                    <div className="muted">
                      {money(line.price)} × {line.quantity}
                    </div>
                  </div>

                  <div className="qty-controls">
                    <button type="button" onClick={() => updateQuantity(line.itemId, line.quantity - 1)}>
                      -
                    </button>
                    <strong>{line.quantity}</strong>
                    <button type="button" onClick={() => updateQuantity(line.itemId, line.quantity + 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 16 }}>
                <label>
                  Discount amount
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                  />
                </label>
              </div>

              <div style={{ marginTop: 12 }}>
                <label>
                  Tip amount
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tip}
                    onChange={(event) => setTip(event.target.value)}
                  />
                </label>
              </div>

              <div style={{ marginTop: 12 }}>
                <label>
                  Payment method
                  <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile">Mobile Pay</option>
                  </select>
                </label>
              </div>

              <div style={{ marginTop: 18 }}>
                <div className="total-line">
                  <span>Subtotal</span>
                  <strong>{money(cartSubtotal)}</strong>
                </div>
                <div className="total-line">
                  <span>Discount</span>
                  <strong>-{money(discountAmount)}</strong>
                </div>
                <div className="total-line">
                  <span>Tip</span>
                  <strong>{money(tipAmount)}</strong>
                </div>
                <div className="total-line grand-total">
                  <span>Total</span>
                  <span>{money(cartTotal)}</span>
                </div>
              </div>

              <button className="primary" type="button" onClick={completeSale} style={{ width: "100%", marginTop: 18 }}>
                Complete Sale
              </button>
            </div>
          </section>
        )}

        {activeView === "menu" && (
          <section className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2 className="title">Add Menu Item</h2>

              <form onSubmit={addMenuItem} className="form-row">
                <input
                  placeholder="Item name"
                  value={newItem.name}
                  onChange={(event) => setNewItem({ ...newItem, name: event.target.value })}
                />
                <input
                  placeholder="Category"
                  value={newItem.category}
                  onChange={(event) => setNewItem({ ...newItem, category: event.target.value })}
                />
                <input
                  placeholder="Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.price}
                  onChange={(event) => setNewItem({ ...newItem, price: event.target.value })}
                />
                <button className="primary" type="submit">
                  Add
                </button>
              </form>

              <div className="notice" style={{ marginTop: 16 }}>
                Example categories: Beer, Wine, Cocktails, Spirits, Soft Drinks, Food, Snacks.
              </div>
            </div>

            <div className="card">
              <h2 className="title">Current Menu</h2>

              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>{item.category}</td>
                      <td>{money(item.price)}</td>
                      <td>
                        <button className="secondary" type="button" onClick={() => toggleMenuItem(item.id)}>
                          {item.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === "reports" && (
          <section className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2 className="title">Daily Report</h2>

              <div className="report-line">
                <span>Total sales</span>
                <strong>{money(todayStats.totalSales)}</strong>
              </div>
              <div className="report-line">
                <span>Orders paid</span>
                <strong>{todayStats.ordersCount}</strong>
              </div>
              <div className="report-line">
                <span>Discounts</span>
                <strong>{money(todayStats.discountsTotal)}</strong>
              </div>
              <div className="report-line">
                <span>Tips</span>
                <strong>{money(todayStats.tipsTotal)}</strong>
              </div>
              <div className="report-line">
                <span>Voided orders</span>
                <strong>{todayStats.voidsCount}</strong>
              </div>
            </div>

            <div className="card">
              <h2 className="title">Sales by Category</h2>

              {categorySales.length === 0 && <p className="muted">No category sales yet today.</p>}

              {categorySales.map((row) => (
                <div className="report-line" key={row.category}>
                  <span>{row.category}</span>
                  <strong>{money(row.total)}</strong>
                </div>
              ))}
            </div>

            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <h2 className="title">Recent Orders</h2>

              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Time</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {todayOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.number}</td>
                      <td>{new Date(order.createdAt).toLocaleTimeString()}</td>
                      <td>
                        {order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}
                      </td>
                      <td>{paymentLabel(order.paymentMethod)}</td>
                      <td>{money(order.total)}</td>
                      <td className={order.status === "paid" ? "status-paid" : "status-voided"}>
                        {order.status}
                      </td>
                      <td>
                        {order.status === "paid" ? (
                          <button className="danger" type="button" onClick={() => voidOrder(order.id)}>
                            Void
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}

                  {todayOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="muted">
                        No orders yet today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === "closing" && (
          <section className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2 className="title">Daily Closing</h2>

              <div className="report-line">
                <span>Business date</span>
                <strong>{todayKey()}</strong>
              </div>
              <div className="report-line">
                <span>Total sales</span>
                <strong>{money(todayStats.totalSales)}</strong>
              </div>
              <div className="report-line">
                <span>Cash expected</span>
                <strong>{money(todayStats.cashTotal)}</strong>
              </div>
              <div className="report-line">
                <span>Card total</span>
                <strong>{money(todayStats.cardTotal)}</strong>
              </div>
              <div className="report-line">
                <span>Mobile total</span>
                <strong>{money(todayStats.mobileTotal)}</strong>
              </div>
              <div className="report-line">
                <span>Tips</span>
                <strong>{money(todayStats.tipsTotal)}</strong>
              </div>

              <div style={{ marginTop: 16 }}>
                <label>
                  Cash counted
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashCounted}
                    onChange={(event) => setCashCounted(event.target.value)}
                    placeholder="Enter counted cash"
                  />
                </label>
              </div>

              <div style={{ marginTop: 12 }}>
                <label>
                  Closing notes
                  <textarea
                    value={closingNotes}
                    onChange={(event) => setClosingNotes(event.target.value)}
                    placeholder="Manager notes, cash difference reason, incidents..."
                    rows={4}
                  />
                </label>
              </div>

              <button className="primary" type="button" onClick={closeDay} style={{ width: "100%", marginTop: 16 }}>
                Close Day
              </button>
            </div>

            <div className="card">
              <h2 className="title">Closing History</h2>

              {closings.length === 0 && <p className="muted">No closing records yet.</p>}

              {closings.map((closing) => (
                <div key={closing.id} className="card" style={{ marginBottom: 12 }}>
                  <div className="report-line">
                    <span>Date</span>
                    <strong>{closing.date}</strong>
                  </div>
                  <div className="report-line">
                    <span>Total sales</span>
                    <strong>{money(closing.totalSales)}</strong>
                  </div>
                  <div className="report-line">
                    <span>Cash difference</span>
                    <strong>{money(closing.cashDifference)}</strong>
                  </div>
                  {closing.notes && <p className="muted">{closing.notes}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="footer-note">
          Phase 1 stores data in this browser for launch testing. Next we will connect a real database,
          login, staff roles, inventory, and Vercel production settings.
        </p>
      </main>
    </div>
  );
}
