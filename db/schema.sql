-- Lumina Café Database Schema

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('coffee', 'tea', 'pastry')),
  image TEXT,
  tags TEXT, -- JSON array stored as text
  isActive INTEGER DEFAULT 1,
  isFeatured INTEGER DEFAULT 0
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  productId TEXT PRIMARY KEY,
  productName TEXT NOT NULL,
  currentStock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  lowStockThreshold INTEGER NOT NULL DEFAULT 10,
  FOREIGN KEY (productId) REFERENCES products(id)
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- Plain text for prototype; PRODUCTION: Use bcrypt hash
  phone TEXT,
  role TEXT NOT NULL CHECK(role IN ('admin', 'employee', 'customer')),
  joinedDate TEXT NOT NULL,
  totalOrders INTEGER DEFAULT 0,
  totalSpent REAL DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended'))
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customerName TEXT NOT NULL,
  customerEmail TEXT NOT NULL,
  customerPhone TEXT,
  customerAddress TEXT,
  customerType TEXT NOT NULL CHECK(customerType IN ('guest', 'registered')),
  userId TEXT,
  items TEXT NOT NULL, -- JSON array stored as text
  subtotal REAL NOT NULL,
  tax REAL NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending_payment', 'in_prep', 'ready', 'completed')),
  timestamp TEXT NOT NULL,
  paymentMethod TEXT NOT NULL CHECK(paymentMethod IN ('manual_qr', 'cash', 'card_pos', 'xendit')),
  fulfillment TEXT NOT NULL CHECK(fulfillment IN ('pickup', 'delivery')),
  feedbackRating INTEGER,
  feedbackComment TEXT,
  feedbackTimestamp TEXT,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Order Items Table (for normalized order line items)
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId TEXT NOT NULL,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price REAL NOT NULL,
  options TEXT, -- JSON object for customizations (size, milk, sweetness, etc.)
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(isActive);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON orders(timestamp);
CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders(userId);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items(orderId);
CREATE INDEX IF NOT EXISTS idx_order_items_productId ON order_items(productId);
