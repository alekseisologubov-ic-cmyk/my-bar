"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type View = "dashboard" | "pos" | "menu" | "reports" | "closing";
type PaymentMethod = "cash" | "card" | "mobile";

type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  active: boolean;
};

type CartItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  number: number;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  tip: number;
  total: number;
  paymentMethod: PaymentMethod;
};

const STORAGE_KEY = "my-bar-pos-v2";

const DEFAULT_MENU: MenuItem[] = [
  { id: "draft-beer", name: "Draft Beer", category: "Beer", price: 5.5, active: true },
  { id: "bottle-beer", name: "Bottle Beer", category: "Beer", price: 6, active: true },
  { id: "mojito", name: "Mojito", category: "Cocktails", price: 9.5, active: true },
  { id: "old-fashioned", name: "Old Fashioned", category: "Cocktails", price: 11, active: true },
  { id: "vodka-soda", name: "Vodka Soda", category: "Spirits", price: 8, active: true },
  { id: "cola", name: "Cola", category: "Soft Drinks", price: 3, active: true },
  { id: "sparkling-water", name: "Sparkling Water", category: "Soft Drinks", price: 2.8, active: true },
  { id: "fries", name: "Fries", category: "Food", price: 5, active: true },
  { id: "burger", name: "Burger", category: "Food", price: 13, active: true }
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
  const [view, setView] = useState<View>("dashboard");

  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [tip, setTip] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cashCounted, setCashCounted] = useState("");

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
        };

        if (Array.isArray(parsed.menuItems)) {
          setMenuItems(parsed.menuItems);
        }

        if (Array.isArray(parsed.orders)) {
          setOrders(parsed.orders);
        }
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
        orders
      })
    );
  }, [loaded, menuItems, orders]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();

    menuItems.forEach((item) => {
      if (item.category.trim()) {
        uniqueCategories.add(item.category.trim());
      }
    });

    return ["All", ...Array.from(uniqueCategories).sort()];
  }, [menuItems]);

  const activeMenuItems = useMemo(() => {
    return menuItems
      .filter((item) => item.active)
      .filter((item) => selectedCategory === "All" || item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const tipAmount = Math.max(Number(tip) || 0, 0);
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

  const salesByCategory = useMemo(() => {
    const totals = new Map<string, number>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const current = totals.get(item.category) || 0;
        totals.set(item.category, current + item.price * item.quantity);
      });
    });

    return Array.from(totals.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [orders]);

  function addToCart(item: MenuItem) {
    if (!item.active) return;

    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.id === item.id);

      if (existing) {
        return current.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [
        ...current,
        {
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: 1
        }
      ];
    });
  }

  function updateCartQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.id !== itemId));
      return;
    }

    setCart((current) =>
      current.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  }

  function completeSale() {
    if (cart.length === 0) {
      alert("Add items first.");
      return;
    }

    const newOrder: Order = {
      id: makeId("order"),
      number: orders.length + 1,
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

    alert(`Sale completed. Order #${newOrder.number}`);
  }

  function addMenuItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newItem.name.trim();
    const category = newItem.category.trim();
    const price = Number(newItem.price);

    if (!name) {
      alert("Enter item name.");
      return;
    }

    if (!category) {
      alert("Enter category.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      alert("Enter a valid price.");
      return;
    }

    const item: MenuItem = {
      id: makeId("menu"),
      name,
      category,
      price,
      active: true
    };

    setMenuItems((current) => [...current, item]);

    setNewItem({
      name: "",
      category,
      price: ""
    });

    setSelectedCategory("All");
  }

  function updateMenuItem(itemId: string, changes: Partial<MenuItem>) {
    setMenuItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, ...changes } : item))
    );
  }

  function toggleMenuItem(itemId: string) {
    setMenuItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, active: !item.active } : item))
    );
  }

  function deleteMenuItem(itemId: string) {
    const approved = confirm("Delete this menu item? Existing orders will keep their sale history.");

    if (!approved) return;

    setMenuItems((current) => current.filter((item) => item.id !== itemId));
    setCart((current) => current.filter((item) => item.id !== itemId));
  }

  function closeDay() {
    const counted = Number(cashCounted);

    if (!Number.isFinite(counted)) {
      alert("Enter counted cash.");
      return;
    }

    alert(
      `Day closed.\n\nTotal sales: ${money(salesTotal)}\nCash expected: ${money(
        cashTotal
      )}\nCash counted: ${money(counted)}\nCash difference: ${money(counted - cashTotal)}`
    );
  }

  function resetDemoData() {
    const approved = confirm("Reset menu and orders? This removes local demo data in this browser.");

    if (!approved) return;

    setMenuItems(DEFAULT_MENU);
    setOrders([]);
    setCart([]);
    setTip("0");
    setCashCounted("");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  const navItems: { key: View; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "pos", label: "POS" },
    { key: "menu", label: "Menu Setup" },
    { key: "reports", label: "Reports" },
    { key: "closing", label: "Daily Closing" }
  ];

  if (!loaded) {
    return (
      <main>
        <header className="header">
          <div className="container">
            <h1>My Bar POS</h1>
            <p>Loading...</p>
          </div>
        </header>
      </main>
    );
  }

  return (
    <main>
      <header className="header">
        <div className="container">
          <h1>My Bar POS</h1>
          <p>Phase 1: sales, menu setup, payments, tips, reports, and daily closing.</p>

          <nav className="nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={view === item.key ? "active" : ""}
                onClick={() => setView(item.key)}
                type="button"
              >
                {item.label}
              </button>
            ))}
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
            <div className="kpi-label">Menu Items</div>
            <div className="kpi-value">{menuItems.length}</div>
          </div>
        </div>

        {view === "dashboard" && (
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2>Dashboard</h2>
              <p>
                Your Vercel app is running. Use Menu Setup to add your own drinks and food,
                then use POS to record test sales.
              </p>

              <div className="button-row">
                <button className="primary" type="button" onClick={() => setView("pos")}>
                  Open POS
                </button>
                <button className="secondary" type="button" onClick={() => setView("menu")}>
                  Edit Menu
                </button>
              </div>
            </div>

            <div className="card">
              <h2>Phase 1 Status</h2>
              <div className="line">
                <span>Vercel deployment</span>
                <strong>Live</strong>
              </div>
              <div className="line">
                <span>Menu setup</span>
                <strong>Added</strong>
              </div>
              <div className="line">
                <span>Data storage</span>
                <strong>Browser local storage</strong>
              </div>
              <div className="line">
                <span>Next phase</span>
                <strong>Tabs / tables</strong>
              </div>

              <button className="danger" type="button" onClick={resetDemoData}>
                Reset Demo Data
              </button>
            </div>
          </div>
        )}

        {view === "pos" && (
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2>POS Menu</h2>

              <div className="category-tabs">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={selectedCategory === category ? "active" : ""}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="menu-grid">
                {activeMenuItems.map((item) => (
                  <button className="menu-item" key={item.id} onClick={() => addToCart(item)} type="button">
                    <strong>{item.name}</strong>
                    <span className="muted">{item.category}</span>
                    <div className="menu-price">{money(item.price)}</div>
                  </button>
                ))}
              </div>

              {activeMenuItems.length === 0 && (
                <p className="muted">No active menu items in this category.</p>
              )}
            </div>

            <div className="card">
              <h2>Current Order</h2>

              {cart.length === 0 && <p className="muted">Cart is empty.</p>}

              {cart.map((item) => (
                <div className="cart-line" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <div className="muted">
                      {item.quantity} × {money(item.price)}
                    </div>
                  </div>

                  <div className="qty">
                    <button type="button" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>
                      -
                    </button>
                    <strong>{item.quantity}</strong>
                    <button type="button" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))}

              <div className="line">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <label>
                Tip
                <input
                  value={tip}
                  onChange={(event) => setTip(event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                />
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

              <div className="line total-line">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>

              <button className="primary" onClick={completeSale} type="button">
                Complete Sale
              </button>
            </div>
          </div>
        )}

        {view === "menu" && (
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2>Add Menu Item</h2>

              <form onSubmit={addMenuItem} className="form-stack">
                <label>
                  Item name
                  <input
                    value={newItem.name}
                    onChange={(event) => setNewItem({ ...newItem, name: event.target.value })}
                    placeholder="Example: Margarita"
                  />
                </label>

                <label>
                  Category
                  <input
                    value={newItem.category}
                    onChange={(event) => setNewItem({ ...newItem, category: event.target.value })}
                    placeholder="Example: Cocktails"
                  />
                </label>

                <label>
                  Price
                  <input
                    value={newItem.price}
                    onChange={(event) => setNewItem({ ...newItem, price: event.target.value })}
                    placeholder="Example: 10.50"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </label>

                <button className="primary" type="submit">
                  Add Item
                </button>
              </form>

              <div className="notice">
                Suggested categories: Beer, Wine, Cocktails, Spirits, Soft Drinks, Food, Snacks.
              </div>
            </div>

            <div className="card">
              <h2>Menu Summary</h2>

              <div className="line">
                <span>Total menu items</span>
                <strong>{menuItems.length}</strong>
              </div>
              <div className="line">
                <span>Active items</span>
                <strong>{menuItems.filter((item) => item.active).length}</strong>
              </div>
              <div className="line">
                <span>Inactive items</span>
                <strong>{menuItems.filter((item) => !item.active).length}</strong>
              </div>
              <div className="line">
                <span>Categories</span>
                <strong>{Math.max(categories.length - 1, 0)}</strong>
              </div>
            </div>

            <div className="card full-width">
              <h2>Current Menu</h2>

              <table className="table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {menuItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          value={item.name}
                          onChange={(event) => updateMenuItem(item.id, { name: event.target.value })}
                          aria-label="Item name"
                        />
                      </td>
                      <td>
                        <input
                          value={item.category}
                          onChange={(event) => updateMenuItem(item.id, { category: event.target.value })}
                          aria-label="Item category"
                        />
                      </td>
                      <td>
                        <input
                          value={item.price}
                          onChange={(event) =>
                            updateMenuItem(item.id, { price: Math.max(Number(event.target.value) || 0, 0) })
                          }
                          type="number"
                          min="0"
                          step="0.01"
                          aria-label="Item price"
                        />
                      </td>
                      <td>
                        <strong className={item.active ? "status-active" : "status-inactive"}>
                          {item.active ? "Active" : "Inactive"}
                        </strong>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="secondary" type="button" onClick={() => toggleMenuItem(item.id)}>
                            {item.active ? "Deactivate" : "Activate"}
                          </button>
                          <button className="danger small" type="button" onClick={() => deleteMenuItem(item.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {menuItems.length === 0 && <p className="muted">No menu items yet.</p>}
            </div>
          </div>
        )}

        {view === "reports" && (
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2>Payment Report</h2>

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
              <div className="line total-line">
                <span>Total sales</span>
                <strong>{money(salesTotal)}</strong>
              </div>
            </div>

            <div className="card">
              <h2>Sales by Category</h2>

              {salesByCategory.length === 0 && <p className="muted">No sales yet.</p>}

              {salesByCategory.map((row) => (
                <div className="line" key={row.category}>
                  <span>{row.category}</span>
                  <strong>{money(row.amount)}</strong>
                </div>
              ))}
            </div>

            <div className="card full-width">
              <h2>Recent Orders</h2>

              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Time</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Tip</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.number}</td>
                      <td>{new Date(order.createdAt).toLocaleTimeString()}</td>
                      <td>{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</td>
                      <td>{paymentLabel(order.paymentMethod)}</td>
                      <td>{money(order.tip)}</td>
                      <td>
                        <strong>{money(order.total)}</strong>
                      </td>
                    </tr>
                  ))}

                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="muted">
                        No orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                min="0"
                step="0.01"
              />
            </label>

            <button className="primary" style={{ marginTop: 16 }} onClick={closeDay} type="button">
              Close Day
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
