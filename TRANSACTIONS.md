# SQLite Transaction Implementation for Order Processing

## Overview

The order creation endpoint (`POST /api/orders`) uses **SQLite transactions** to ensure data consistency and atomicity when processing orders. This prevents inventory inconsistencies and ensures that either all operations succeed or none do.

## Transaction Flow

### 1. Start Transaction

```typescript
const placeOrder = db.transaction(() => {
  // All operations here are atomic
});
```

### 2. Check Inventory & Deduct Stock

For each item in the order:

```typescript
// Check current stock
const inventory = checkInventoryStmt.get(item.id);

if (!inventory) {
  throw new Error(`Product ${item.name} not found in inventory`);
}

if (inventory.currentStock < quantity) {
  throw new Error(`Insufficient stock for ${item.name}...`);
}

// Deduct stock
updateInventoryStmt.run(quantity, item.id);
```

**Critical**: If ANY item has insufficient stock, an error is thrown and the **entire transaction is rolled back**.

### 3. Insert into Orders Table

```typescript
insertOrderStmt.run(
  orderId,
  customer.name,
  customer.email,
  // ... other fields
);
```

### 4. Insert into Order Items Table

For each item:

```typescript
insertOrderItemStmt.run(
  orderId,
  item.id,
  item.name,
  item.quantity || 1,
  item.price,
  item.options ? JSON.stringify(item.options) : null
);
```

### 5. Update User Statistics

If the customer is a registered user:

```typescript
updateUserStmt.run(total, customer.userId);
```

### 6. Commit Transaction

If all operations succeed, the transaction is automatically committed and the order object is returned.

## Rollback Behavior

### Automatic Rollback

The transaction automatically rolls back if:
- Any item has insufficient stock
- A product is not found in inventory
- Any database constraint is violated
- Any error is thrown during the transaction

### What Gets Rolled Back

When a rollback occurs:
- ❌ Inventory changes are reverted
- ❌ Order is NOT created in the orders table
- ❌ Order items are NOT inserted
- ❌ User statistics are NOT updated

**Result**: Database remains in its original state, as if the order attempt never happened.

## Testing Results

### Test 1: Successful Order ✅

**Request:**
```json
{
  "customer": {"name": "Transaction Test", "email": "transaction@test.com", "type": "guest"},
  "items": [
    {"id": "1", "name": "Velvet Latte", "price": 5.5, "quantity": 2}
  ],
  "subtotal": 11.0,
  "tax": 1.1,
  "total": 12.1
}
```

**Result:**
- ✅ Order created: `ord-1765209072912`
- ✅ Inventory deducted: 150 → 147 (quantity: 2 + 1 from previous test)
- ✅ Order items inserted: 1 row
- ✅ Response: 201 Created

### Test 2: Insufficient Stock (Single Item) ❌

**Request:**
```json
{
  "customer": {"name": "Rollback Test", "email": "rollback@test.com", "type": "guest"},
  "items": [
    {"id": "4", "name": "Golden Croissant", "price": 3.75, "quantity": 999}
  ],
  "subtotal": 3742.5,
  "tax": 374.25,
  "total": 4116.75
}
```

**Result:**
- ❌ Error: "Insufficient stock for Golden Croissant. Available: 12, Requested: 999"
- ✅ Inventory unchanged: 12 (rollback successful)
- ✅ No order created
- ✅ Response: 400 Bad Request

### Test 3: Partial Failure (Multiple Items) ❌

**Request:**
```json
{
  "items": [
    {"id": "2", "name": "Cold Brew Noir", "quantity": 2},
    {"id": "4", "name": "Golden Croissant", "quantity": 50}
  ]
}
```

**Result:**
- ❌ Error: "Insufficient stock for Golden Croissant. Available: 12, Requested: 50"
- ✅ Cold Brew inventory unchanged: 40 (first item rolled back too!)
- ✅ Croissant inventory unchanged: 12
- ✅ No order created
- ✅ Response: 400 Bad Request

**Key Point**: Even though Cold Brew had sufficient stock, the entire transaction was rolled back when the second item failed.

### Test 4: Successful Multi-Item Order ✅

**Request:**
```json
{
  "customer": {"name": "Alice Member", "userId": "u-1", "type": "registered"},
  "items": [
    {"id": "2", "name": "Cold Brew Noir", "quantity": 3},
    {"id": "4", "name": "Golden Croissant", "quantity": 2}
  ],
  "total": 23.1
}
```

**Result:**
- ✅ Order created: `ord-1765209143577`
- ✅ Cold Brew inventory: 40 → 37
- ✅ Croissant inventory: 12 → 10
- ✅ Order items inserted: 2 rows
- ✅ User stats updated: totalOrders: 12 → 13, totalSpent: 145.5 → 168.6
- ✅ Response: 201 Created

## Database Schema

### Orders Table

```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customerName TEXT NOT NULL,
  customerEmail TEXT NOT NULL,
  customerPhone TEXT,
  customerAddress TEXT,
  customerType TEXT NOT NULL,
  userId TEXT,
  items TEXT NOT NULL, -- JSON array for backward compatibility
  subtotal REAL NOT NULL,
  tax REAL NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  paymentMethod TEXT NOT NULL,
  fulfillment TEXT NOT NULL,
  feedbackRating INTEGER,
  feedbackComment TEXT,
  feedbackTimestamp TEXT,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Order Items Table (NEW)

```sql
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId TEXT NOT NULL,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price REAL NOT NULL,
  options TEXT, -- JSON object for customizations
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id)
);
```

### Inventory Table

```sql
CREATE TABLE inventory (
  productId TEXT PRIMARY KEY,
  productName TEXT NOT NULL,
  currentStock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  lowStockThreshold INTEGER NOT NULL DEFAULT 10,
  FOREIGN KEY (productId) REFERENCES products(id)
);
```

## API Endpoint

### POST /api/orders

**Request Body:**
```json
{
  "customer": {
    "name": "string",
    "email": "string",
    "phone": "string (optional)",
    "address": "string (optional)",
    "type": "guest | registered",
    "userId": "string (optional, required if type=registered)"
  },
  "items": [
    {
      "id": "string",
      "name": "string",
      "price": number,
      "quantity": number,
      "options": {
        "size": "S | M | L",
        "milk": "Dairy | Oat | Almond | Soy",
        "sweetness": "0% | 50% | 100%"
      }
    }
  ],
  "subtotal": number,
  "tax": number,
  "total": number,
  "paymentMethod": "manual_qr | cash | card_pos",
  "fulfillment": "pickup | delivery"
}
```

**Success Response (201):**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "ord-1765209143577",
    "customer": { ... },
    "items": [ ... ],
    "subtotal": 21.0,
    "tax": 2.1,
    "total": 23.1,
    "status": "pending_payment",
    "timestamp": "2025-12-08T15:52:23.577Z",
    "paymentMethod": "card_pos",
    "fulfillment": "pickup"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Insufficient stock for Golden Croissant. Available: 12, Requested: 50"
}
```

## Benefits of Transaction-Based Approach

### 1. **Atomicity**
All operations succeed together or fail together. No partial orders.

### 2. **Consistency**
Database always remains in a valid state. Inventory always matches orders.

### 3. **Isolation**
Concurrent orders don't interfere with each other. SQLite handles locking automatically.

### 4. **Durability**
Once committed, the order is permanently saved (WAL mode enabled).

### 5. **Error Recovery**
Automatic rollback on any error means no manual cleanup needed.

### 6. **Race Condition Prevention**
Two customers can't order the last item simultaneously - one will get a rollback.

## Code Example

```typescript
// Define the transaction
const placeOrder = db.transaction(() => {
  // 1. Check and deduct inventory
  for (const item of items) {
    const inventory = checkInventoryStmt.get(item.id);
    if (inventory.currentStock < item.quantity) {
      throw new Error('Insufficient stock'); // Triggers rollback
    }
    updateInventoryStmt.run(item.quantity, item.id);
  }
  
  // 2. Insert order
  insertOrderStmt.run(...orderData);
  
  // 3. Insert order items
  for (const item of items) {
    insertOrderItemStmt.run(...itemData);
  }
  
  // 4. Update user stats
  if (customer.userId) {
    updateUserStmt.run(total, customer.userId);
  }
  
  return orderObject;
});

// Execute the transaction
try {
  const newOrder = placeOrder(); // Commits if successful
  return res.status(201).json({ order: newOrder });
} catch (error) {
  // Automatic rollback already happened
  return res.status(400).json({ error: error.message });
}
```

## Performance Considerations

- **WAL Mode**: Write-Ahead Logging enabled for better concurrency
- **Prepared Statements**: All queries use prepared statements for performance
- **Single Transaction**: All operations in one transaction minimize overhead
- **Indexes**: Foreign keys and frequently queried columns are indexed

## Future Enhancements

1. **Optimistic Locking**: Add version numbers to prevent lost updates
2. **Inventory Reservations**: Reserve stock for pending payments
3. **Audit Trail**: Log all inventory changes with timestamps
4. **Stock Alerts**: Trigger notifications when stock falls below threshold
5. **Batch Operations**: Support bulk order processing with transactions

---

**Last Updated**: December 8, 2025  
**SQLite Version**: 3.x with WAL mode  
**better-sqlite3 Version**: 12.5.0

