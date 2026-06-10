"use client";

import { useEffect, useMemo, useState } from "react";

type View = "dashboard" | "pos" | "reports" | "closing";
type PaymentMethod = "cash" | "card" | "mobile";

type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
};

type CartItem = MenuItem & {
  quantity: number;
};

type Order = {
  id: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  tip: number;
  total: number;
  paymentMethod: PaymentMethod;
};

const menuItems: MenuItem[] = [
  { id: "beer", name: "Draft Beer", category: "Beer", price: 5.5 },
  { id: "mojito", name: "Mojito", category: "Cocktails", price: 9.5 },
  { id: "old-fashioned", name: "Old Fashioned", category: "Cocktails", price: 11 },
  { id: "cola", name: "Cola", category: "Soft Drinks", price: 3 },
  { id: "fries", name: "Fries", category: "Food", price: 5 },
  { id: "burger", name: "Burger", category: "Food", price: 13 }
];

function money(value: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export default function HomePage() {
  const [view, setView] = useState<View>("dashboard");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tip, setTip] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cashCounted, setCashCounted] = useState("");

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const tipAmount = Number(tip) || 0;
  const total = subtotal + tipAmount;

  const salesTotal = orders.reduce((sum, order) => sum + order.total, 0);
  const tipsTotal = orders.reduce((sum, order) => sum + order.tip, 0);
  const cashTotal = orders
    .filter((order) => order.paymentMethod === "cash")
    .reduce((sum, order) => sum + order.total, 0);
  const cardTotal = orders
    .filter((order) => order.paymentMethod === "card")
    .reduce((sum, order) => sum + order.total, 0);
  const mobileTotal = orders
    .filter((order) => order.paymentMethod === "mobile")
    .reduce((sum, order) => sum + order.total, 0);

  function addToCart(item: MenuItem) {
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.id === item.id);

      if (existing) {
        return current.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [...current, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart((current) => current.filter((item) => item.id !== itemId));
  }

  function completeSale() {
    if (cart.length === 0) {
      alert("Add items first.");
      return;
    }

    const newOrder: Order = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      items: cart,
      subtotal,
      tip: tipAmount,
      total,
      paymentMethod
    };

    setOrders((current) => [newOrder, ...current]);
    setCart([]);
    setTip("0");
    alert("Sale completed.");
  }

  function closeDay() {
    const counted = Number(cashCounted);

    if (!Number.isFinite(counted)) {
      alert("Enter counted cash.");
      return;
    }

    alert(
      `Day closed.\nCash expected: ${money(cashTotal)}\nCash counted: ${money(
        counted
      )}\nDifference: ${money(counted - cashTotal)}`
    );
  }

  return (
    <main>
      <header className="header">
        <div className="container">
          <h1>My Bar POS</h1>
          <p>Phase 1: sales, payments, tips, reports, and daily closing.</p>

          <nav className="nav">
            <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>
              Dashboard
            </button>
            <button className={view === "pos" ? "active" : ""} onClick={() => setView("pos")}>
              POS
            </button>
            <button className={view === "reports" ? "active" : ""} onClick={() => setView("reports")}>
              Reports
            </button>
            <button className={view === "closing" ? "active" : ""} onClick={() => setView("closing")}>
              Daily Closing
            </button>
          </nav>
        </div>
      </header>

      <section className="container">
        <div className="grid grid-4">
          <div className="card">
            <div className="kpi-label">Sales</div>
            <div className="kpi-value">{money(salesTotal)}</div>
          </div>
          <div className="card">
            <div className="kpi-label">Orders</div>
            <div className="kpi-value">{orders.length}</div>
          </div>
          <div className="card">
            <div className="kpi-label">Tips</div>
            <div className="kpi-value">{money(tipsTotal)}</div>
          </div>
          <div className="card">
            <div className="kpi-label">Cash expected</div>
            <div className="kpi-value">{money(cashTotal)}</div>
          </div>
        </div>

        {view === "dashboard" && (
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Dashboard</h2>
            <p>
              Your Vercel app is now running. Use the POS tab to create a test sale, then check Reports
              and Daily Closing.
            </p>
          </div>
        )}

        {view === "pos" && (
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2>POS Menu</h2>
              <div className="menu-grid">
                {menuItems.map((item) => (
                  <button className="menu-item" key={item.id} onClick={() => addToCart(item)}>
                    <strong>{item.name}</strong>
                    <span className="muted">{item.category}</span>
                    <div>{money(item.price)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <h2>Current Order</h2>

              {cart.length === 0 && <p className="muted">Cart is empty.</p>}

              {cart.map((item) => (
                <div className="line" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <div className="muted">
                      {item.quantity} × {money(item.price)}
                    </div>
                  </div>
                  <button className="secondary" onClick={() => removeFromCart(item.id)}>
                    Remove
                  </button>
                </div>
              ))}

              <div className="line">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <label>
                Tip
                <input value={tip} onChange={(event) => setTip(event.target.value)} type="number" />
              </label>

              <label>
                Payment method
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile">Mobile Pay</option>
                </select>
              </label>

              <div className="line">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>

              <button className="primary" onClick={completeSale}>
                Complete Sale
              </button>
            </div>
          </div>
        )}

        {view === "reports" && (
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Reports</h2>

            <div className="line">
              <span>Cash</span>
              <strong>{money(cashTotal)}</strong>
            </div>
            <div className="line">
              <span>Card</span>
              <strong>{money(cardTotal)}</strong>
            </div>
            <div className="line">
              <span>Mobile Pay</span>
              <strong>{money(mobileTotal)}</strong>
            </div>

            <h3>Recent Orders</h3>
            {orders.length === 0 && <p className="muted">No orders yet.</p>}

            {orders.map((order, index) => (
              <div className="line" key={order.id}>
                <span>
                  Order #{orders.length - index} — {order.paymentMethod}
                </span>
                <strong>{money(order.total)}</strong>
              </div>
            ))}
          </div>
        )}

        {view === "closing" && (
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Daily Closing</h2>

            <div className="line">
              <span>Total sales</span>
              <strong>{money(salesTotal)}</strong>
            </div>
            <div className="line">
              <span>Cash expected</span>
              <strong>{money(cashTotal)}</strong>
            </div>
            <div className="line">
              <span>Card total</span>
              <strong>{money(cardTotal)}</strong>
            </div>
            <div className="line">
              <span>Mobile total</span>
              <strong>{money(mobileTotal)}</strong>
            </div>
            <div className="line">
              <span>Tips</span>
              <strong>{money(tipsTotal)}</strong>
            </div>

            <label>
              Cash counted
              <input
                value={cashCounted}
                onChange={(event) => setCashCounted(event.target.value)}
                type="number"
              />
            </label>

            <button className="primary" style={{ marginTop: 16 }} onClick={closeDay}>
              Close Day
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
