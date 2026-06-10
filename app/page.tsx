"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type View =
  | "dashboard"
  | "pos"
  | "tabs"
  | "menu"
  | "products"
  | "admin"
  | "users"
  | "reports"
  | "closing";

type PaymentMethod = "cash" | "card" | "mobile";
type UserRole = "Admin" | "Manager" | "Bartender" | "Waiter";
type TabType = "bar" | "table";
type OrderStatus = "paid" | "voided";
type MovementType = "delivery" | "waste" | "adjustment" | "sale";

type StaffUser = {
  id: string;
  name: string;
  role: UserRole;
  active: boolean;
};

type VenueTable = {
  id: string;
  name: string;
  seats: number;
  active: boolean;
};

type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  active: boolean;
};

type CartItem = {
  itemId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

type CustomerTab = {
  id: string;
  name: string;
  type: TabType;
  tableId?: string;
  customerName: string;
  staffUserId: string;
  openedAt: string;
  closedAt?: string;
  status: "open" | "closed";
  items: CartItem[];
};

type Order = {
  id: string;
  number: number;
  createdAt: string;
  source: "quick" | "tab";
  tabName?: string;
  staffUserId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tip: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
};

type InventoryProduct = {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  reorderPoint: number;
  costPerUnit: number;
  supplier: string;
  active: boolean;
};

type StockMovement = {
  id: string;
  productId: string;
  productNameSnapshot: string;
  type: MovementType;
  signedQuantity: number;
  unitCost: number;
  supplier: string;
  reference: string;
  note: string;
  createdAt: string;
};

type RecipeItem = {
  id: string;
  menuItemId: string;
  productId: string;
  quantity: number;
};

type TabCloseForm = {
  paymentMethod: PaymentMethod;
  tip: string;
  discount: string;
};

const STORAGE_KEY = "my-bar-pos-v4";

const DEFAULT_USERS: StaffUser[] = [
  { id: "user-owner", name: "Owner", role: "Admin", active: true },
  { id: "user-sofia", name: "Sofia", role: "Manager", active: true },
  { id: "user-maria", name: "Maria", role: "Bartender", active: true },
  { id: "user-james", name: "James", role: "Waiter", active: true }
];

const DEFAULT_TABLES: VenueTable[] = [
  { id: "table-bar", name: "Bar", seats: 8, active: true },
  { id: "table-1", name: "Table 1", seats: 2, active: true },
  { id: "table-2", name: "Table 2", seats: 4, active: true },
  { id: "table-3", name: "Table 3", seats: 4, active: true },
  { id: "table-4", name: "Table 4", seats: 6, active: true }
];

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

const DEFAULT_PRODUCTS: InventoryProduct[] = [
  {
    id: "product-lager-keg",
    name: "Lager Keg",
    category: "Alcohol",
    unit: "L",
    stock: 50,
    reorderPoint: 10,
    costPerUnit: 2.3,
    supplier: "BrewCo",
    active: true
  },
  {
    id: "product-bottle-beer",
    name: "Bottle Beer Stock",
    category: "Alcohol",
    unit: "bottle",
    stock: 80,
    reorderPoint: 24,
    costPerUnit: 2.1,
    supplier: "BrewCo",
    active: true
  },
  {
    id: "product-white-rum",
    name: "White Rum",
    category: "Alcohol",
    unit: "ml",
    stock: 5000,
    reorderPoint: 1000,
    costPerUnit: 0.018,
    supplier: "Spirits Supplier",
    active: true
  },
  {
    id: "product-bourbon",
    name: "Bourbon",
    category: "Alcohol",
    unit: "ml",
    stock: 4000,
    reorderPoint: 1000,
    costPerUnit: 0.024,
    supplier: "Spirits Supplier",
    active: true
  },
  {
    id: "product-vodka",
    name: "Vodka",
    category: "Alcohol",
    unit: "ml",
    stock: 5000,
    reorderPoint: 1000,
    costPerUnit: 0.016,
    supplier: "Spirits Supplier",
    active: true
  },
  {
    id: "product-cola",
    name: "Cola",
    category: "Soft Drinks",
    unit: "bottle",
    stock: 48,
    reorderPoint: 12,
    costPerUnit: 0.75,
    supplier: "Drinks Supplier",
    active: true
  },
  {
    id: "product-water",
    name: "Sparkling Water",
    category: "Soft Drinks",
    unit: "bottle",
    stock: 36,
    reorderPoint: 12,
    costPerUnit: 0.55,
    supplier: "Drinks Supplier",
    active: true
  },
  {
    id: "product-fries",
    name: "Fries Portion",
    category: "Food",
    unit: "portion",
    stock: 60,
    reorderPoint: 15,
    costPerUnit: 1.1,
    supplier: "Food Supplier",
    active: true
  },
  {
    id: "product-burger-patty",
    name: "Burger Patty",
    category: "Food",
    unit: "unit",
    stock: 40,
    reorderPoint: 10,
    costPerUnit: 2.2,
    supplier: "Food Supplier",
    active: true
  }
];

const DEFAULT_RECIPES: RecipeItem[] = [
  { id: "recipe-draft-beer-lager", menuItemId: "draft-beer", productId: "product-lager-keg", quantity: 0.5 },
  { id: "recipe-bottle-beer", menuItemId: "bottle-beer", productId: "product-bottle-beer", quantity: 1 },
  { id: "recipe-mojito-rum", menuItemId: "mojito", productId: "product-white-rum", quantity: 50 },
  { id: "recipe-old-fashioned-bourbon", menuItemId: "old-fashioned", productId: "product-bourbon", quantity: 60 },
  { id: "recipe-vodka-soda-vodka", menuItemId: "vodka-soda", productId: "product-vodka", quantity: 50 },
  { id: "recipe-cola", menuItemId: "cola", productId: "product-cola", quantity: 1 },
  { id: "recipe-water", menuItemId: "sparkling-water", productId: "product-water", quantity: 1 },
  { id: "recipe-fries", menuItemId: "fries", productId: "product-fries", quantity: 1 },
  { id: "recipe-burger-patty", menuItemId: "burger", productId: "product-burger-patty", quantity: 1 }
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

function numberText(value: number) {
  return new Intl.NumberFormat("en-IE", {
    maximumFractionDigits: 3
  }).format(Number.isFinite(value) ? value : 0);
}

function paymentLabel(method: PaymentMethod) {
  if (method === "cash") return "Cash";
  if (method === "card") return "Card";
  return "Mobile Pay";
}

function movementLabel(type: MovementType) {
  if (type === "delivery") return "Delivery";
  if (type === "waste") return "Waste / Spillage";
  if (type === "adjustment") return "Adjustment";
  return "Sale Deduction";
}

function calculateSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function mergeItems(existingItems: CartItem[], incomingItems: CartItem[]) {
  const merged = existingItems.map((item) => ({ ...item }));

  incomingItems.forEach((incoming) => {
    const existing = merged.find((item) => item.itemId === incoming.itemId);

    if (existing) {
      existing.quantity += incoming.quantity;
    } else {
      merged.push({ ...incoming });
    }
  });

  return merged;
}

function defaultTabCloseForm(): TabCloseForm {
  return {
    paymentMethod: "card",
    tip: "0",
    discount: "0"
  };
}

export default function HomePage() {
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("dashboard");

  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU);
  const [users, setUsers] = useState<StaffUser[]>(DEFAULT_USERS);
  const [tables, setTables] = useState<VenueTable[]>(DEFAULT_TABLES);
  const [tabs, setTabs] = useState<CustomerTab[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>(DEFAULT_PRODUCTS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>(DEFAULT_RECIPES);

  const [currentStaffUserId, setCurrentStaffUserId] = useState(DEFAULT_USERS[2].id);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTabTarget, setSelectedTabTarget] = useState("quick");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [tip, setTip] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [cashCounted, setCashCounted] = useState("");

  const [tabCloseForms, setTabCloseForms] = useState<Record<string, TabCloseForm>>({});

  const [newItem, setNewItem] = useState({
    name: "",
    category: "Cocktails",
    price: ""
  });

  const [newUser, setNewUser] = useState({
    name: "",
    role: "Waiter" as UserRole
  });

  const [newTable, setNewTable] = useState({
    name: "",
    seats: "2"
  });

  const [newTab, setNewTab] = useState({
    type: "bar" as TabType,
    tableId: "table-1",
    name: "",
    customerName: "",
    staffUserId: DEFAULT_USERS[2].id
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Alcohol",
    unit: "unit",
    stock: "",
    reorderPoint: "",
    costPerUnit: "",
    supplier: ""
  });

  const [deliveryForm, setDeliveryForm] = useState({
    productId: DEFAULT_PRODUCTS[0].id,
    quantity: "",
    unitCost: "",
    supplier: "",
    reference: "",
    note: ""
  });

  const [wasteForm, setWasteForm] = useState({
    productId: DEFAULT_PRODUCTS[0].id,
    quantity: "",
    note: ""
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: DEFAULT_PRODUCTS[0].id,
    quantity: "",
    note: ""
  });

  const [recipeForm, setRecipeForm] = useState({
    menuItemId: DEFAULT_MENU[0].id,
    productId: DEFAULT_PRODUCTS[0].id,
    quantity: ""
  });

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          menuItems?: MenuItem[];
          users?: StaffUser[];
          tables?: VenueTable[];
          tabs?: CustomerTab[];
          orders?: Order[];
          inventoryProducts?: InventoryProduct[];
          stockMovements?: StockMovement[];
          recipes?: RecipeItem[];
        };

        if (Array.isArray(parsed.menuItems)) setMenuItems(parsed.menuItems);
        if (Array.isArray(parsed.users)) setUsers(parsed.users);
        if (Array.isArray(parsed.tables)) setTables(parsed.tables);
        if (Array.isArray(parsed.tabs)) setTabs(parsed.tabs);
        if (Array.isArray(parsed.orders)) setOrders(parsed.orders);
        if (Array.isArray(parsed.inventoryProducts)) setInventoryProducts(parsed.inventoryProducts);
        if (Array.isArray(parsed.stockMovements)) setStockMovements(parsed.stockMovements);
        if (Array.isArray(parsed.recipes)) setRecipes(parsed.recipes);
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
        users,
        tables,
        tabs,
        orders,
        inventoryProducts,
        stockMovements,
        recipes
      })
    );
  }, [loaded, menuItems, users, tables, tabs, orders, inventoryProducts, stockMovements, recipes]);

  useEffect(() => {
    if (selectedTabTarget === "quick") return;

    const tabExists = tabs.some((tab) => tab.id === selectedTabTarget && tab.status === "open");

    if (!tabExists) {
      setSelectedTabTarget("quick");
    }
  }, [selectedTabTarget, tabs]);

  const activeUsers = users.filter((user) => user.active);
  const activeTables = tables.filter((table) => table.active);
  const openTabs = tabs.filter((tab) => tab.status === "open");
  const closedTabs = tabs.filter((tab) => tab.status === "closed");
  const activeProducts = inventoryProducts.filter((product) => product.active);
  const lowStockProducts = inventoryProducts.filter(
    (product) => product.active && product.stock <= product.reorderPoint
  );

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

  const subtotal = useMemo(() => calculateSubtotal(cart), [cart]);
  const discountAmount = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const tipAmount = Math.max(Number(tip) || 0, 0);
  const total = Math.max(subtotal - discountAmount + tipAmount, 0);

  const paidOrders = orders.filter((order) => order.status === "paid");

  const salesTotal = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const tipsTotal = paidOrders.reduce((sum, order) => sum + order.tip, 0);
  const discountsTotal = paidOrders.reduce((sum, order) => sum + order.discount, 0);

  const cashTotal = paidOrders
    .filter((order) => order.paymentMethod === "cash")
    .reduce((sum, order) => sum + order.total, 0);

  const cardTotal = paidOrders
    .filter((order) => order.paymentMethod === "card")
    .reduce((sum, order) => sum + order.total, 0);

  const mobileTotal = paidOrders
    .filter((order) => order.paymentMethod === "mobile")
    .reduce((sum, order) => sum + order.total, 0);

  const openTabValue = openTabs.reduce((sum, tab) => sum + calculateSubtotal(tab.items), 0);

  const inventoryValue = inventoryProducts.reduce(
    (sum, product) => sum + product.stock * product.costPerUnit,
    0
  );

  const salesByCategory = useMemo(() => {
    const totals = new Map<string, number>();

    paidOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = totals.get(item.category) || 0;
        totals.set(item.category, current + item.price * item.quantity);
      });
    });

    return Array.from(totals.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [paidOrders]);

  const salesByStaff = useMemo(() => {
    return users
      .map((user) => {
        const amount = paidOrders
          .filter((order) => order.staffUserId === user.id)
          .reduce((sum, order) => sum + order.total, 0);

        return {
          user,
          amount
        };
      })
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [paidOrders, users]);

  function getUserName(userId: string) {
    return users.find((user) => user.id === userId)?.name || "Unknown";
  }

  function getTableName(tableId?: string) {
    if (!tableId) return "No table";
    return tables.find((table) => table.id === tableId)?.name || "Unknown table";
  }

  function getMenuItemName(menuItemId: string) {
    return menuItems.find((item) => item.id === menuItemId)?.name || "Unknown menu item";
  }

  function getProduct(productId: string) {
    return inventoryProducts.find((product) => product.id === productId);
  }

  function addToCart(item: MenuItem) {
    if (!item.active) return;

    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.itemId === item.id);

      if (existing) {
        return current.map((cartItem) =>
          cartItem.itemId === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
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

  function updateCartQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.itemId !== itemId));
      return;
    }

    setCart((current) =>
      current.map((item) => (item.itemId === itemId ? { ...item, quantity } : item))
    );
  }

  function deductStockForOrderItems(orderItems: CartItem[], reference: string) {
    const requiredProducts = new Map<string, number>();

    orderItems.forEach((orderItem) => {
      recipes
        .filter((recipe) => recipe.menuItemId === orderItem.itemId)
        .forEach((recipe) => {
          const current = requiredProducts.get(recipe.productId) || 0;
          requiredProducts.set(recipe.productId, current + recipe.quantity * orderItem.quantity);
        });
    });

    if (requiredProducts.size === 0) return;

    setInventoryProducts((current) =>
      current.map((product) => {
        const requiredQuantity = requiredProducts.get(product.id) || 0;

        if (requiredQuantity === 0) {
          return product;
        }

        return {
          ...product,
          stock: product.stock - requiredQuantity
        };
      })
    );

    const now = new Date().toISOString();

    const saleMovements: StockMovement[] = Array.from(requiredProducts.entries()).map(
      ([productId, quantity]) => {
        const product = getProduct(productId);

        return {
          id: makeId("movement"),
          productId,
          productNameSnapshot: product?.name || "Unknown product",
          type: "sale",
          signedQuantity: -quantity,
          unitCost: product?.costPerUnit || 0,
          supplier: product?.supplier || "",
          reference,
          note: "Automatic deduction from menu item recipe",
          createdAt: now
        };
      }
    );

    setStockMovements((current) => [...saleMovements, ...current]);
  }

  function completeQuickSale() {
    if (cart.length === 0) {
      alert("Add items first.");
      return;
    }

    const newOrder: Order = {
      id: makeId("order"),
      number: orders.length + 1,
      createdAt: new Date().toISOString(),
      source: "quick",
      staffUserId: currentStaffUserId,
      items: cart,
      subtotal,
      discount: discountAmount,
      tip: tipAmount,
      total,
      paymentMethod,
      status: "paid"
    };

    setOrders((current) => [newOrder, ...current]);
    deductStockForOrderItems(cart, `Order #${newOrder.number}`);

    setCart([]);
    setTip("0");
    setDiscount("0");

    alert(`Sale completed. Order #${newOrder.number}`);
  }

  function addCartToSelectedTab() {
    if (cart.length === 0) {
      alert("Add items first.");
      return;
    }

    const tab = openTabs.find((openTab) => openTab.id === selectedTabTarget);

    if (!tab) {
      alert("Select an open tab first.");
      return;
    }

    setTabs((current) =>
      current.map((currentTab) =>
        currentTab.id === tab.id
          ? {
              ...currentTab,
              items: mergeItems(currentTab.items, cart)
            }
          : currentTab
      )
    );

    setCart([]);
    alert(`Items added to ${tab.name}.`);
  }

  function createTab(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const table = activeTables.find((venueTable) => venueTable.id === newTab.tableId);
    const customerName = newTab.customerName.trim();

    if (newTab.type === "table" && !table) {
      alert("Select a table.");
      return;
    }

    const fallbackName =
      newTab.type === "table"
        ? table?.name || `Table Tab ${openTabs.length + 1}`
        : `Bar Tab ${openTabs.length + 1}`;

    const tabName = newTab.name.trim() || customerName || fallbackName;

    const tab: CustomerTab = {
      id: makeId("tab"),
      name: tabName,
      type: newTab.type,
      tableId: newTab.type === "table" ? newTab.tableId : undefined,
      customerName,
      staffUserId: newTab.staffUserId || currentStaffUserId,
      openedAt: new Date().toISOString(),
      status: "open",
      items: []
    };

    setTabs((current) => [tab, ...current]);
    setSelectedTabTarget(tab.id);

    setNewTab({
      type: "bar",
      tableId: activeTables[0]?.id || "",
      name: "",
      customerName: "",
      staffUserId: currentStaffUserId
    });

    setView("pos");
  }

  function updateTabItemQuantity(tabId: string, itemId: string, quantity: number) {
    setTabs((current) =>
      current.map((tab) => {
        if (tab.id !== tabId) return tab;

        if (quantity <= 0) {
          return {
            ...tab,
            items: tab.items.filter((item) => item.itemId !== itemId)
          };
        }

        return {
          ...tab,
          items: tab.items.map((item) =>
            item.itemId === itemId ? { ...item, quantity } : item
          )
        };
      })
    );
  }

  function updateTabCloseForm(tabId: string, changes: Partial<TabCloseForm>) {
    setTabCloseForms((current) => ({
      ...current,
      [tabId]: {
        ...defaultTabCloseForm(),
        ...(current[tabId] || {}),
        ...changes
      }
    }));
  }

  function closeTab(tabId: string) {
    const tab = openTabs.find((openTab) => openTab.id === tabId);

    if (!tab) {
      alert("Tab not found.");
      return;
    }

    if (tab.items.length === 0) {
      alert("This tab has no items.");
      return;
    }

    const form = tabCloseForms[tabId] || defaultTabCloseForm();
    const tabSubtotal = calculateSubtotal(tab.items);
    const tabDiscount = Math.min(Math.max(Number(form.discount) || 0, 0), tabSubtotal);
    const tabTip = Math.max(Number(form.tip) || 0, 0);
    const tabTotal = Math.max(tabSubtotal - tabDiscount + tabTip, 0);

    const newOrder: Order = {
      id: makeId("order"),
      number: orders.length + 1,
      createdAt: new Date().toISOString(),
      source: "tab",
      tabName: tab.name,
      staffUserId: tab.staffUserId,
      items: tab.items,
      subtotal: tabSubtotal,
      discount: tabDiscount,
      tip: tabTip,
      total: tabTotal,
      paymentMethod: form.paymentMethod,
      status: "paid"
    };

    setOrders((current) => [newOrder, ...current]);
    deductStockForOrderItems(tab.items, `Order #${newOrder.number} from ${tab.name}`);

    setTabs((current) =>
      current.map((currentTab) =>
        currentTab.id === tabId
          ? {
              ...currentTab,
              status: "closed",
              closedAt: new Date().toISOString()
            }
          : currentTab
      )
    );

    setTabCloseForms((current) => {
      const next = { ...current };
      delete next[tabId];
      return next;
    });

    alert(`${tab.name} closed. Order #${newOrder.number}`);
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

    setMenuItems((current) => [
      ...current,
      {
        id: makeId("menu"),
        name,
        category,
        price,
        active: true
      }
    ]);

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
    const approved = confirm("Delete this menu item? Existing orders keep their sale history.");

    if (!approved) return;

    setMenuItems((current) => current.filter((item) => item.id !== itemId));
    setCart((current) => current.filter((item) => item.itemId !== itemId));
    setRecipes((current) => current.filter((recipe) => recipe.menuItemId !== itemId));
  }

  function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newProduct.name.trim();
    const category = newProduct.category.trim();
    const unit = newProduct.unit.trim();
    const stock = Number(newProduct.stock) || 0;
    const reorderPoint = Number(newProduct.reorderPoint) || 0;
    const costPerUnit = Number(newProduct.costPerUnit) || 0;
    const supplier = newProduct.supplier.trim();

    if (!name) {
      alert("Enter product name.");
      return;
    }

    if (!category) {
      alert("Enter product category.");
      return;
    }

    if (!unit) {
      alert("Enter unit, for example ml, L, bottle, kg, portion, unit.");
      return;
    }

    const product: InventoryProduct = {
      id: makeId("product"),
      name,
      category,
      unit,
      stock,
      reorderPoint,
      costPerUnit,
      supplier,
      active: true
    };

    setInventoryProducts((current) => [...current, product]);

    if (stock !== 0) {
      const movement: StockMovement = {
        id: makeId("movement"),
        productId: product.id,
        productNameSnapshot: product.name,
        type: "adjustment",
        signedQuantity: stock,
        unitCost: costPerUnit,
        supplier,
        reference: "Opening stock",
        note: "Initial stock entered when product was created",
        createdAt: new Date().toISOString()
      };

      setStockMovements((current) => [movement, ...current]);
    }

    setNewProduct({
      name: "",
      category,
      unit,
      stock: "",
      reorderPoint: "",
      costPerUnit: "",
      supplier
    });
  }

  function updateProduct(productId: string, changes: Partial<InventoryProduct>) {
    setInventoryProducts((current) =>
      current.map((product) => (product.id === productId ? { ...product, ...changes } : product))
    );
  }

  function toggleProduct(productId: string) {
    setInventoryProducts((current) =>
      current.map((product) =>
        product.id === productId ? { ...product, active: !product.active } : product
      )
    );
  }

  function applyStockMovement(params: {
    productId: string;
    type: MovementType;
    signedQuantity: number;
    unitCost?: number;
    supplier?: string;
    reference?: string;
    note?: string;
  }) {
    const product = getProduct(params.productId);

    if (!product) {
      alert("Product not found.");
      return;
    }

    if (!Number.isFinite(params.signedQuantity) || params.signedQuantity === 0) {
      alert("Enter a valid quantity.");
      return;
    }

    const unitCost = Number.isFinite(params.unitCost || 0)
      ? params.unitCost || product.costPerUnit
      : product.costPerUnit;

    setInventoryProducts((current) =>
      current.map((currentProduct) =>
        currentProduct.id === product.id
          ? {
              ...currentProduct,
              stock: currentProduct.stock + params.signedQuantity,
              costPerUnit:
                params.type === "delivery" && unitCost > 0
                  ? unitCost
                  : currentProduct.costPerUnit,
              supplier:
                params.type === "delivery" && params.supplier
                  ? params.supplier
                  : currentProduct.supplier
            }
          : currentProduct
      )
    );

    const movement: StockMovement = {
      id: makeId("movement"),
      productId: product.id,
      productNameSnapshot: product.name,
      type: params.type,
      signedQuantity: params.signedQuantity,
      unitCost,
      supplier: params.supplier || product.supplier,
      reference: params.reference || "",
      note: params.note || "",
      createdAt: new Date().toISOString()
    };

    setStockMovements((current) => [movement, ...current]);
  }

  function receiveStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const product = getProduct(deliveryForm.productId);
    const quantity = Number(deliveryForm.quantity);
    const unitCost = Number(deliveryForm.unitCost);

    if (!product) {
      alert("Select a product.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert("Enter delivery quantity.");
      return;
    }

    applyStockMovement({
      productId: product.id,
      type: "delivery",
      signedQuantity: quantity,
      unitCost: Number.isFinite(unitCost) && unitCost > 0 ? unitCost : product.costPerUnit,
      supplier: deliveryForm.supplier.trim() || product.supplier,
      reference: deliveryForm.reference.trim(),
      note: deliveryForm.note.trim() || "Product arrived / stock received"
    });

    setDeliveryForm({
      productId: product.id,
      quantity: "",
      unitCost: "",
      supplier: deliveryForm.supplier.trim() || product.supplier,
      reference: "",
      note: ""
    });
  }

  function recordWaste(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const product = getProduct(wasteForm.productId);
    const quantity = Number(wasteForm.quantity);

    if (!product) {
      alert("Select a product.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert("Enter waste/spillage quantity.");
      return;
    }

    applyStockMovement({
      productId: product.id,
      type: "waste",
      signedQuantity: -quantity,
      unitCost: product.costPerUnit,
      supplier: product.supplier,
      reference: "Waste / spillage",
      note: wasteForm.note.trim() || "Waste or spillage recorded"
    });

    setWasteForm({
      productId: product.id,
      quantity: "",
      note: ""
    });
  }

  function recordAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const product = getProduct(adjustmentForm.productId);
    const quantity = Number(adjustmentForm.quantity);

    if (!product) {
      alert("Select a product.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity === 0) {
      alert("Enter adjustment quantity. Use positive to add stock or negative to reduce stock.");
      return;
    }

    applyStockMovement({
      productId: product.id,
      type: "adjustment",
      signedQuantity: quantity,
      unitCost: product.costPerUnit,
      supplier: product.supplier,
      reference: "Manual adjustment",
      note: adjustmentForm.note.trim() || "Manual stock adjustment"
    });

    setAdjustmentForm({
      productId: product.id,
      quantity: "",
      note: ""
    });
  }

  function addRecipeItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quantity = Number(recipeForm.quantity);

    if (!recipeForm.menuItemId) {
      alert("Select menu item.");
      return;
    }

    if (!recipeForm.productId) {
      alert("Select inventory product.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert("Enter quantity used per sale.");
      return;
    }

    const existing = recipes.find(
      (recipe) =>
        recipe.menuItemId === recipeForm.menuItemId &&
        recipe.productId === recipeForm.productId
    );

    if (existing) {
      setRecipes((current) =>
        current.map((recipe) =>
          recipe.id === existing.id ? { ...recipe, quantity } : recipe
        )
      );
    } else {
      setRecipes((current) => [
        ...current,
        {
          id: makeId("recipe"),
          menuItemId: recipeForm.menuItemId,
          productId: recipeForm.productId,
          quantity
        }
      ]);
    }

    setRecipeForm({
      ...recipeForm,
      quantity: ""
    });
  }

  function deleteRecipeItem(recipeId: string) {
    setRecipes((current) => current.filter((recipe) => recipe.id !== recipeId));
  }

  function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newUser.name.trim();

    if (!name) {
      alert("Enter user name.");
      return;
    }

    setUsers((current) => [
      ...current,
      {
        id: makeId("user"),
        name,
        role: newUser.role,
        active: true
      }
    ]);

    setNewUser({
      name: "",
      role: "Waiter"
    });
  }

  function updateUser(userId: string, changes: Partial<StaffUser>) {
    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, ...changes } : user))
    );
  }

  function toggleUser(userId: string) {
    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, active: !user.active } : user))
    );
  }

  function addTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newTable.name.trim();
    const seats = Math.max(Number(newTable.seats) || 1, 1);

    if (!name) {
      alert("Enter table name.");
      return;
    }

    setTables((current) => [
      ...current,
      {
        id: makeId("table"),
        name,
        seats,
        active: true
      }
    ]);

    setNewTable({
      name: "",
      seats: "2"
    });
  }

  function updateTable(tableId: string, changes: Partial<VenueTable>) {
    setTables((current) =>
      current.map((table) => (table.id === tableId ? { ...table, ...changes } : table))
    );
  }

  function toggleTable(tableId: string) {
    setTables((current) =>
      current.map((table) => (table.id === tableId ? { ...table, active: !table.active } : table))
    );
  }

  function voidOrder(orderId: string) {
    const approved = confirm("Void this order? It will stay in reports but no longer count as paid sales.");

    if (!approved) return;

    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: "voided" } : order))
    );
  }

  function closeDay() {
    if (openTabs.length > 0) {
      alert("Close all open tabs before daily closing.");
      return;
    }

    const counted = Number(cashCounted);

    if (!Number.isFinite(counted)) {
      alert("Enter counted cash.");
      return;
    }

    alert(
      `Day closed.\n\nTotal sales: ${money(salesTotal)}\nCash expected: ${money(
        cashTotal
      )}\nCash counted: ${money(counted)}\nCash difference: ${money(
        counted - cashTotal
      )}\nTips: ${money(tipsTotal)}`
    );
  }

  function exportLocalData() {
    const data = {
      exportedAt: new Date().toISOString(),
      menuItems,
      users,
      tables,
      tabs,
      orders,
      inventoryProducts,
      stockMovements,
      recipes
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const download = document.createElement("a");

    download.href = url;
    download.download = "my-bar-pos-export.json";
    download.click();

    URL.revokeObjectURL(url);
  }

  function resetDemoData() {
    const approved = confirm("Reset all local demo data in this browser?");

    if (!approved) return;

    setMenuItems(DEFAULT_MENU);
    setUsers(DEFAULT_USERS);
    setTables(DEFAULT_TABLES);
    setTabs([]);
    setOrders([]);
    setCart([]);
    setInventoryProducts(DEFAULT_PRODUCTS);
    setStockMovements([]);
    setRecipes(DEFAULT_RECIPES);
    setTip("0");
    setDiscount("0");
    setCashCounted("");
    setSelectedTabTarget("quick");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  const navItems: { key: View; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "pos", label: "POS" },
    { key: "tabs", label: "Tables & Tabs" },
    { key: "menu", label: "Menu Setup" },
    { key: "products", label: "Products / Stock" },
    { key: "admin", label: "Admin" },
    { key: "users", label: "Users" },
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
          <p>Phase 1: POS, menu, tables, users, products, stock, reports, and closing.</p>

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
            <div className="kpi-label">Open Tabs</div>
            <div className="kpi-value">{openTabs.length}</div>
          </div>
          <div className="card">
            <div className="kpi-label">Inventory Value</div>
            <div className="kpi-value">{money(inventoryValue)}</div>
          </div>
          <div className="card">
            <div className="kpi-label">Low Stock</div>
            <div className="kpi-value">{lowStockProducts.length}</div>
          </div>
        </div>

        {view === "dashboard" && (
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2>Dashboard</h2>
              <p>
                Your app now includes POS, menu setup, tables, tabs, users, admin controls,
                product stock, stock arrivals, waste, recipes, and automatic stock deduction.
              </p>

              <div className="button-row">
                <button className="primary" type="button" onClick={() => setView("pos")}>
                  Open POS
                </button>
                <button className="secondary" type="button" onClick={() => setView("products")}>
                  Open Products / Stock
                </button>
                <button className="secondary" type="button" onClick={() => setView("tabs")}>
                  Open Tabs
                </button>
              </div>
            </div>

            <div className="card">
              <h2>Stock Alerts</h2>

              {lowStockProducts.length === 0 && <p className="muted">No low-stock products right now.</p>}

              {lowStockProducts.slice(0, 8).map((product) => (
                <div className="line" key={product.id}>
                  <span>
                    {product.name} · {product.supplier || "No supplier"}
                  </span>
                  <strong className="status-voided">
                    {numberText(product.stock)} {product.unit}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "pos" && (
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2>POS Menu</h2>

              <label>
                Staff member
                <select
                  value={currentStaffUserId}
                  onChange={(event) => setCurrentStaffUserId(event.target.value)}
                >
                  {activeUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} — {user.role}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Sale target
                <select
                  value={selectedTabTarget}
                  onChange={(event) => setSelectedTabTarget(event.target.value)}
                >
                  <option value="quick">Quick paid sale</option>
                  {openTabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      Add to tab: {tab.name}
                    </option>
                  ))}
                </select>
              </label>

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
                <div className="cart-line" key={item.itemId}>
                  <div>
                    <strong>{item.name}</strong>
                    <div className="muted">
                      {item.quantity} × {money(item.price)}
                    </div>
                  </div>

                  <div className="qty">
                    <button type="button" onClick={() => updateCartQuantity(item.itemId, item.quantity - 1)}>
                      -
                    </button>
                    <strong>{item.quantity}</strong>
                    <button type="button" onClick={() => updateCartQuantity(item.itemId, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))}

              <div className="line">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>

              {selectedTabTarget === "quick" && (
                <>
                  <label>
                    Discount
                    <input
                      value={discount}
                      onChange={(event) => setDiscount(event.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </label>

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

                  <button className="primary" onClick={completeQuickSale} type="button">
                    Complete Sale
                  </button>
                </>
              )}

              {selectedTabTarget !== "quick" && (
                <>
                  <div className="notice">
                    This order will be added to an open tab. Payment happens later when the tab is closed.
                  </div>

                  <button className="primary" onClick={addCartToSelectedTab} type="button">
                    Add Items to Tab
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {view === "tabs" && (
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2>Open New Table / Bar Tab</h2>

              <form onSubmit={createTab} className="form-stack">
                <label>
                  Type
                  <select
                    value={newTab.type}
                    onChange={(event) =>
                      setNewTab({ ...newTab, type: event.target.value as TabType })
                    }
                  >
                    <option value="bar">Bar Tab</option>
                    <option value="table">Table</option>
                  </select>
                </label>

                {newTab.type === "table" && (
                  <label>
                    Table
                    <select
                      value={newTab.tableId}
                      onChange={(event) => setNewTab({ ...newTab, tableId: event.target.value })}
                    >
                      {activeTables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.name} — {table.seats} seats
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label>
                  Tab name
                  <input
                    value={newTab.name}
                    onChange={(event) => setNewTab({ ...newTab, name: event.target.value })}
                    placeholder="Example: Table 4 / John"
                  />
                </label>

                <label>
                  Customer name
                  <input
                    value={newTab.customerName}
                    onChange={(event) =>
                      setNewTab({ ...newTab, customerName: event.target.value })
                    }
                    placeholder="Optional"
                  />
                </label>

                <label>
                  Assigned staff
                  <select
                    value={newTab.staffUserId}
                    onChange={(event) =>
                      setNewTab({ ...newTab, staffUserId: event.target.value })
                    }
                  >
                    {activeUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} — {user.role}
                      </option>
                    ))}
                  </select>
                </label>

                <button className="primary" type="submit">
                  Open Tab
                </button>
              </form>
            </div>

            <div className="card">
              <h2>Tabs Summary</h2>
              <div className="line">
                <span>Open tabs</span>
                <strong>{openTabs.length}</strong>
              </div>
              <div className="line">
                <span>Closed tabs</span>
                <strong>{closedTabs.length}</strong>
              </div>
              <div className="line">
                <span>Open tab value</span>
                <strong>{money(openTabValue)}</strong>
              </div>
              <div className="line">
                <span>Tables active</span>
                <strong>{activeTables.length}</strong>
              </div>
            </div>

            <div className="card full-width">
              <h2>Open Tabs</h2>

              {openTabs.length === 0 && <p className="muted">No open tabs yet.</p>}

              <div className="tab-grid">
                {openTabs.map((tab) => {
                  const form = tabCloseForms[tab.id] || defaultTabCloseForm();
                  const tabSubtotal = calculateSubtotal(tab.items);
                  const tabDiscount = Math.min(Math.max(Number(form.discount) || 0, 0), tabSubtotal);
                  const tabTip = Math.max(Number(form.tip) || 0, 0);
                  const tabTotal = Math.max(tabSubtotal - tabDiscount + tabTip, 0);

                  return (
                    <div className="tab-card" key={tab.id}>
                      <div className="tab-header">
                        <div>
                          <h3>{tab.name}</h3>
                          <p className="muted">
                            {tab.type === "table" ? getTableName(tab.tableId) : "Bar tab"} · Staff:{" "}
                            {getUserName(tab.staffUserId)}
                          </p>
                        </div>
                        <span className="pill open">Open</span>
                      </div>

                      {tab.items.length === 0 && <p className="muted">No items yet.</p>}

                      {tab.items.map((item) => (
                        <div className="cart-line" key={item.itemId}>
                          <div>
                            <strong>{item.name}</strong>
                            <div className="muted">
                              {item.quantity} × {money(item.price)}
                            </div>
                          </div>

                          <div className="qty">
                            <button
                              type="button"
                              onClick={() => updateTabItemQuantity(tab.id, item.itemId, item.quantity - 1)}
                            >
                              -
                            </button>
                            <strong>{item.quantity}</strong>
                            <button
                              type="button"
                              onClick={() => updateTabItemQuantity(tab.id, item.itemId, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="line">
                        <span>Subtotal</span>
                        <strong>{money(tabSubtotal)}</strong>
                      </div>

                      <label>
                        Discount
                        <input
                          value={form.discount}
                          onChange={(event) =>
                            updateTabCloseForm(tab.id, { discount: event.target.value })
                          }
                          type="number"
                          min="0"
                          step="0.01"
                        />
                      </label>

                      <label>
                        Tip
                        <input
                          value={form.tip}
                          onChange={(event) =>
                            updateTabCloseForm(tab.id, { tip: event.target.value })
                          }
                          type="number"
                          min="0"
                          step="0.01"
                        />
                      </label>

                      <label>
                        Payment method
                        <select
                          value={form.paymentMethod}
                          onChange={(event) =>
                            updateTabCloseForm(tab.id, {
                              paymentMethod: event.target.value as PaymentMethod
                            })
                          }
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="mobile">Mobile Pay</option>
                        </select>
                      </label>

                      <div className="line total-line">
                        <span>Total</span>
                        <strong>{money(tabTotal)}</strong>
                      </div>

                      <button className="primary" type="button" onClick={() => closeTab(tab.id)}>
                        Close Tab & Pay
                      </button>
                    </div>
                  );
                })}
              </div>
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
                    onChange={(event) =>
                      setNewItem({ ...newItem, category: event.target.value })
                    }
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
                After adding a menu item, connect it to products in Products / Stock using recipes.
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
                          onChange={(event) =>
                            updateMenuItem(item.id, { category: event.target.value })
                          }
                          aria-label="Item category"
                        />
                      </td>
                      <td>
                        <input
                          value={item.price}
                          onChange={(event) =>
                            updateMenuItem(item.id, {
                              price: Math.max(Number(event.target.value) || 0, 0)
                            })
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
                          <button
                            className="secondary"
                            type="button"
                            onClick={() => toggleMenuItem(item.id)}
                          >
                            {item.active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className="danger small"
                            type="button"
                            onClick={() => deleteMenuItem(item.id)}
                          >
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

        {view === "products" && (
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2>Product / Inventory Dashboard</h2>

              <div className="line">
                <span>Total products</span>
                <strong>{inventoryProducts.length}</strong>
              </div>
              <div className="line">
                <span>Active products</span>
                <strong>{activeProducts.length}</strong>
              </div>
              <div className="line">
                <span>Low-stock products</span>
                <strong className={lowStockProducts.length > 0 ? "status-voided" : "status-active"}>
                  {lowStockProducts.length}
                </strong>
              </div>
              <div className="line">
                <span>Inventory value</span>
                <strong>{money(inventoryValue)}</strong>
              </div>
            </div>

            <div className="card">
              <h2>Add Product</h2>

              <form onSubmit={addProduct} className="form-stack">
                <label>
                  Product name
                  <input
                    value={newProduct.name}
                    onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })}
                    placeholder="Example: Tequila"
                  />
                </label>

                <label>
                  Category
                  <input
                    value={newProduct.category}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, category: event.target.value })
                    }
                    placeholder="Example: Alcohol"
                  />
                </label>

                <label>
                  Unit
                  <input
                    value={newProduct.unit}
                    onChange={(event) => setNewProduct({ ...newProduct, unit: event.target.value })}
                    placeholder="ml, L, bottle, kg, portion, unit"
                  />
                </label>

                <label>
                  Current stock
                  <input
                    value={newProduct.stock}
                    onChange={(event) => setNewProduct({ ...newProduct, stock: event.target.value })}
                    type="number"
                    step="0.001"
                    placeholder="Example: 5000"
                  />
                </label>

                <label>
                  Reorder point
                  <input
                    value={newProduct.reorderPoint}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, reorderPoint: event.target.value })
                    }
                    type="number"
                    step="0.001"
                    placeholder="Example: 1000"
                  />
                </label>

                <label>
                  Cost per unit
                  <input
                    value={newProduct.costPerUnit}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, costPerUnit: event.target.value })
                    }
                    type="number"
                    step="0.001"
                    placeholder="Example: 0.018"
                  />
                </label>

                <label>
                  Supplier
                  <input
                    value={newProduct.supplier}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, supplier: event.target.value })
                    }
                    placeholder="Example: Spirits Supplier"
                  />
                </label>

                <button className="primary" type="submit">
                  Add Product
                </button>
              </form>
            </div>

            <div className="card">
              <h2>Receive Stock / Product Arrivals</h2>
              <p className="muted">
                Use this when products arrive from suppliers. This adds quantity to stock and records a delivery movement.
              </p>

              <form onSubmit={receiveStock} className="form-stack">
                <label>
                  Product
                  <select
                    value={deliveryForm.productId}
                    onChange={(event) =>
                      setDeliveryForm({ ...deliveryForm, productId: event.target.value })
                    }
                  >
                    {inventoryProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — current {numberText(product.stock)} {product.unit}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Quantity received
                  <input
                    value={deliveryForm.quantity}
                    onChange={(event) =>
                      setDeliveryForm({ ...deliveryForm, quantity: event.target.value })
                    }
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="Example: 12"
                  />
                </label>

                <label>
                  Unit cost
                  <input
                    value={deliveryForm.unitCost}
                    onChange={(event) =>
                      setDeliveryForm({ ...deliveryForm, unitCost: event.target.value })
                    }
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="Optional"
                  />
                </label>

                <label>
                  Supplier
                  <input
                    value={deliveryForm.supplier}
                    onChange={(event) =>
                      setDeliveryForm({ ...deliveryForm, supplier: event.target.value })
                    }
                    placeholder="Supplier name"
                  />
                </label>

                <label>
                  Invoice / reference
                  <input
                    value={deliveryForm.reference}
                    onChange={(event) =>
                      setDeliveryForm({ ...deliveryForm, reference: event.target.value })
                    }
                    placeholder="Example: INV-10045"
                  />
                </label>

                <label>
                  Note
                  <textarea
                    value={deliveryForm.note}
                    onChange={(event) => setDeliveryForm({ ...deliveryForm, note: event.target.value })}
                    placeholder="Optional delivery note"
                    rows={3}
                  />
                </label>

                <button className="primary" type="submit">
                  Add to Stock
                </button>
              </form>
            </div>

            <div className="card">
              <h2>Waste / Spillage</h2>

              <form onSubmit={recordWaste} className="form-stack">
                <label>
                  Product
                  <select
                    value={wasteForm.productId}
                    onChange={(event) =>
                      setWasteForm({ ...wasteForm, productId: event.target.value })
                    }
                  >
                    {inventoryProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — current {numberText(product.stock)} {product.unit}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Quantity wasted/spilled
                  <input
                    value={wasteForm.quantity}
                    onChange={(event) =>
                      setWasteForm({ ...wasteForm, quantity: event.target.value })
                    }
                    type="number"
                    min="0"
                    step="0.001"
                  />
                </label>

                <label>
                  Reason / note
                  <textarea
                    value={wasteForm.note}
                    onChange={(event) => setWasteForm({ ...wasteForm, note: event.target.value })}
                    placeholder="Example: broken bottle, over-pour, expired stock"
                    rows={3}
                  />
                </label>

                <button className="danger" type="submit">
                  Record Waste
                </button>
              </form>
            </div>

            <div className="card">
              <h2>Manual Stock Adjustment</h2>
              <p className="muted">
                Use positive quantity to add stock. Use negative quantity to reduce stock.
              </p>

              <form onSubmit={recordAdjustment} className="form-stack">
                <label>
                  Product
                  <select
                    value={adjustmentForm.productId}
                    onChange={(event) =>
                      setAdjustmentForm({ ...adjustmentForm, productId: event.target.value })
                    }
                  >
                    {inventoryProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — current {numberText(product.stock)} {product.unit}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Adjustment quantity
                  <input
                    value={adjustmentForm.quantity}
                    onChange={(event) =>
                      setAdjustmentForm({ ...adjustmentForm, quantity: event.target.value })
                    }
                    type="number"
                    step="0.001"
                    placeholder="Example: 5 or -5"
                  />
                </label>

                <label>
                  Reason / note
                  <textarea
                    value={adjustmentForm.note}
                    onChange={(event) =>
                      setAdjustmentForm({ ...adjustmentForm, note: event.target.value })
                    }
                    placeholder="Example: stock count correction"
                    rows={3}
                  />
                </label>

                <button className="secondary" type="submit">
                  Save Adjustment
                </button>
              </form>
            </div>

            <div className="card">
              <h2>Recipe Setup</h2>
              <p className="muted">
                Link menu items to stock products. When the menu item is sold, stock is deducted automatically.
              </p>

              <form onSubmit={addRecipeItem} className="form-stack">
                <label>
                  Menu item
                  <select
                    value={recipeForm.menuItemId}
                    onChange={(event) =>
                      setRecipeForm({ ...recipeForm, menuItemId: event.target.value })
                    }
                  >
                    {menuItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Stock product
                  <select
                    value={recipeForm.productId}
                    onChange={(event) =>
                      setRecipeForm({ ...recipeForm, productId: event.target.value })
                    }
                  >
                    {inventoryProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — {product.unit}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Quantity used per sale
                  <input
                    value={recipeForm.quantity}
                    onChange={(event) =>
                      setRecipeForm({ ...recipeForm, quantity: event.target.value })
                    }
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="Example: 50 for 50ml"
                  />
                </label>

                <button className="primary" type="submit">
                  Save Recipe Line
                </button>
              </form>
            </div>

            <div className="card full-width">
              <h2>Current Stock</h2>

              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Supplier</th>
                    <th>Stock</th>
                    <th>Reorder</th>
                    <th>Unit cost</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {inventoryProducts.map((product) => {
                    const isLow = product.active && product.stock <= product.reorderPoint;

                    return (
                      <tr key={product.id}>
                        <td>
                          <input
                            value={product.name}
                            onChange={(event) => updateProduct(product.id, { name: event.target.value })}
                          />
                          <div className="muted">{product.unit}</div>
                        </td>
                        <td>
                          <input
                            value={product.category}
                            onChange={(event) =>
                              updateProduct(product.id, { category: event.target.value })
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={product.supplier}
                            onChange={(event) =>
                              updateProduct(product.id, { supplier: event.target.value })
                            }
                          />
                        </td>
                        <td>
                          <strong className={isLow ? "status-voided" : "status-paid"}>
                            {numberText(product.stock)} {product.unit}
                          </strong>
                        </td>
                        <td>
                          <input
                            value={product.reorderPoint}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                reorderPoint: Math.max(Number(event.target.value) || 0, 0)
                              })
                            }
                            type="number"
                            min="0"
                            step="0.001"
                          />
                        </td>
                        <td>
                          <input
                            value={product.costPerUnit}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                costPerUnit: Math.max(Number(event.target.value) || 0, 0)
                              })
                            }
                            type="number"
                            min="0"
                            step="0.001"
                          />
                        </td>
                        <td>
                          <strong>{money(product.stock * product.costPerUnit)}</strong>
                        </td>
                        <td>
                          {isLow ? (
                            <strong className="status-voided">Low stock</strong>
                          ) : (
                            <strong className="status-active">
                              {product.active ? "OK" : "Inactive"}
                            </strong>
                          )}
                        </td>
                        <td>
                          <button className="secondary" type="button" onClick={() => toggleProduct(product.id)}>
                            {product.active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="card full-width">
              <h2>Recipe Links</h2>

              <table className="table">
                <thead>
                  <tr>
                    <th>Menu item</th>
                    <th>Stock product</th>
                    <th>Quantity per sale</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {recipes.map((recipe) => {
                    const product = getProduct(recipe.productId);

                    return (
                      <tr key={recipe.id}>
                        <td>{getMenuItemName(recipe.menuItemId)}</td>
                        <td>{product?.name || "Unknown product"}</td>
                        <td>
                          {numberText(recipe.quantity)} {product?.unit || ""}
                        </td>
                        <td>
                          <button
                            className="danger small"
                            type="button"
                            onClick={() => deleteRecipeItem(recipe.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {recipes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted">
                        No recipe links yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="card full-width">
              <h2>Recent Stock Movements</h2>

              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Supplier</th>
                    <th>Reference</th>
                    <th>Note</th>
                  </tr>
                </thead>

                <tbody>
                  {stockMovements.slice(0, 60).map((movement) => {
                    const product = getProduct(movement.productId);
                    const quantityClass = movement.signedQuantity >= 0 ? "status-active" : "status-voided";

                    return (
                      <tr key={movement.id}>
                        <td>{new Date(movement.createdAt).toLocaleString()}</td>
                        <td>{movement.productNameSnapshot}</td>
                        <td>{movementLabel(movement.type)}</td>
                        <td>
                          <strong className={quantityClass}>
                            {movement.signedQuantity > 0 ? "+" : ""}
                            {numberText(movement.signedQuantity)} {product?.unit || ""}
                          </strong>
                        </td>
                        <td>{movement.supplier || "-"}</td>
                        <td>{movement.reference || "-"}</td>
                        <td>{movement.note || "-"}</td>
                      </tr>
                    );
                  })}

                  {stockMovements.length === 0 && (
                    <tr>
                      <td colSpan={7} className="muted">
                        No stock movements yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "admin" && (
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2>Admin Dashboard</h2>

              <div className="line">
                <span>Total sales</span>
                <strong>{money(salesTotal)}</strong>
              </div>
              <div className="line">
                <span>Open tabs</span>
                <strong>{openTabs.length}</strong>
              </div>
              <div className="line">
                <span>Inventory value</span>
                <strong>{money(inventoryValue)}</strong>
              </div>
              <div className="line">
                <span>Low-stock products</span>
                <strong>{lowStockProducts.length}</strong>
              </div>
              <div className="line">
                <span>Active users</span>
                <strong>{activeUsers.length}</strong>
              </div>

              <div className="button-row">
                <button className="secondary" type="button" onClick={exportLocalData}>
                  Export Local Data
                </button>
                <button className="danger" type="button" onClick={resetDemoData}>
                  Reset Demo Data
                </button>
              </div>
            </div>

            <div className="card">
              <h2>System Roadmap</h2>

              <div className="line">
                <span>POS</span>
                <strong className="status-active">Live</strong>
              </div>
              <div className="line">
                <span>Tables & tabs</span>
                <strong className="status-active">Live</strong>
              </div>
              <div className="line">
                <span>Users dashboard</span>
                <strong className="status-active">Live</strong>
              </div>
              <div className="line">
                <span>Products / stock</span>
                <strong className="status-active">Live</strong>
              </div>
              <div className="line">
                <span>Database + login</span>
                <strong>Next major phase</strong>
              </div>
            </div>

            <div className="card full-width">
              <h2>Table Setup</h2>

              <form onSubmit={addTable} className="inline-form">
                <input
                  value={newTable.name}
                  onChange={(event) => setNewTable({ ...newTable, name: event.target.value })}
                  placeholder="Table name"
                />
                <input
                  value={newTable.seats}
                  onChange={(event) => setNewTable({ ...newTable, seats: event.target.value })}
                  type="number"
                  min="1"
                  placeholder="Seats"
                />
                <button className="primary" type="submit">
                  Add Table
                </button>
              </form>

              <table className="table">
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Seats</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {tables.map((table) => (
                    <tr key={table.id}>
                      <td>
                        <input
                          value={table.name}
                          onChange={(event) => updateTable(table.id, { name: event.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          value={table.seats}
                          onChange={(event) =>
                            updateTable(table.id, {
                              seats: Math.max(Number(event.target.value) || 1, 1)
                            })
                          }
                          type="number"
                          min="1"
                        />
                      </td>
                      <td>
                        <strong className={table.active ? "status-active" : "status-inactive"}>
                          {table.active ? "Active" : "Inactive"}
                        </strong>
                      </td>
                      <td>
                        <button className="secondary" type="button" onClick={() => toggleTable(table.id)}>
                          {table.active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "users" && (
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2>Users Dashboard</h2>

              <div className="line">
                <span>Total users</span>
                <strong>{users.length}</strong>
              </div>
              <div className="line">
                <span>Active users</span>
                <strong>{activeUsers.length}</strong>
              </div>
              <div className="line">
                <span>Managers/Admins</span>
                <strong>
                  {users.filter((user) => user.role === "Admin" || user.role === "Manager").length}
                </strong>
              </div>
              <div className="line">
                <span>Bartenders/Waiters</span>
                <strong>
                  {users.filter((user) => user.role === "Bartender" || user.role === "Waiter").length}
                </strong>
              </div>
            </div>

            <div className="card">
              <h2>Add User</h2>

              <form onSubmit={addUser} className="form-stack">
                <label>
                  Name
                  <input
                    value={newUser.name}
                    onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
                    placeholder="Example: Alex"
                  />
                </label>

                <label>
                  Role
                  <select
                    value={newUser.role}
                    onChange={(event) =>
                      setNewUser({ ...newUser, role: event.target.value as UserRole })
                    }
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Bartender">Bartender</option>
                    <option value="Waiter">Waiter</option>
                  </select>
                </label>

                <button className="primary" type="submit">
                  Add User
                </button>
              </form>
            </div>

            <div className="card full-width">
              <h2>Current Users</h2>

              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Sales</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => {
                    const userSales = paidOrders
                      .filter((order) => order.staffUserId === user.id)
                      .reduce((sum, order) => sum + order.total, 0);

                    return (
                      <tr key={user.id}>
                        <td>
                          <input
                            value={user.name}
                            onChange={(event) => updateUser(user.id, { name: event.target.value })}
                          />
                        </td>
                        <td>
                          <select
                            value={user.role}
                            onChange={(event) =>
                              updateUser(user.id, { role: event.target.value as UserRole })
                            }
                          >
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Bartender">Bartender</option>
                            <option value="Waiter">Waiter</option>
                          </select>
                        </td>
                        <td>
                          <strong className={user.active ? "status-active" : "status-inactive"}>
                            {user.active ? "Active" : "Inactive"}
                          </strong>
                        </td>
                        <td>
                          <strong>{money(userSales)}</strong>
                        </td>
                        <td>
                          <button className="secondary" type="button" onClick={() => toggleUser(user.id)}>
                            {user.active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
              <div className="line">
                <span>Discounts</span>
                <strong>{money(discountsTotal)}</strong>
              </div>
              <div className="line total-line">
                <span>Total sales</span>
                <strong>{money(salesTotal)}</strong>
              </div>
            </div>

            <div className="card">
              <h2>Inventory Report</h2>

              <div className="line">
                <span>Inventory value</span>
                <strong>{money(inventoryValue)}</strong>
              </div>
              <div className="line">
                <span>Low-stock products</span>
                <strong>{lowStockProducts.length}</strong>
              </div>
              <div className="line">
                <span>Stock movements</span>
                <strong>{stockMovements.length}</strong>
              </div>
              <div className="line">
                <span>Recipe links</span>
                <strong>{recipes.length}</strong>
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

            <div className="card">
              <h2>Sales by Staff</h2>

              {salesByStaff.length === 0 && <p className="muted">No staff sales yet.</p>}

              {salesByStaff.map((row) => (
                <div className="line" key={row.user.id}>
                  <span>
                    {row.user.name} — {row.user.role}
                  </span>
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
                    <th>Source</th>
                    <th>Staff</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.number}</td>
                      <td>{new Date(order.createdAt).toLocaleTimeString()}</td>
                      <td>{order.source === "tab" ? order.tabName || "Tab" : "Quick Sale"}</td>
                      <td>{getUserName(order.staffUserId)}</td>
                      <td>{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</td>
                      <td>{paymentLabel(order.paymentMethod)}</td>
                      <td>
                        <strong>{money(order.total)}</strong>
                      </td>
                      <td>
                        <strong className={order.status === "paid" ? "status-paid" : "status-voided"}>
                          {order.status}
                        </strong>
                      </td>
                      <td>
                        {order.status === "paid" ? (
                          <button className="danger small" type="button" onClick={() => voidOrder(order.id)}>
                            Void
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}

                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={9} className="muted">
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

            {openTabs.length > 0 && (
              <div className="warning">
                You have {openTabs.length} open tab(s). Close all tabs before daily closing.
              </div>
            )}

            {lowStockProducts.length > 0 && (
              <div className="warning">
                {lowStockProducts.length} product(s) are low stock. Check Products / Stock before ordering.
              </div>
            )}

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
            <div className="line">
              <span>Discounts</span>
              <strong>{money(discountsTotal)}</strong>
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
