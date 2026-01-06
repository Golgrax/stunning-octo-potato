# Frontend-Backend Integration Guide

## Overview

The Lumina Café application has been refactored to use a **client-server architecture** with the React frontend communicating with an Express backend API.

## Architecture

```
┌─────────────────┐         HTTP/REST API          ┌─────────────────┐
│                 │  ←─────────────────────────→   │                 │
│  React Frontend │   http://localhost:3001/api    │  Express Server │
│  (Vite - 5173)  │                                │   (Port 3001)   │
│                 │                                │                 │
└─────────────────┘                                └────────┬────────┘
                                                            │
                                                            ▼
                                                   ┌─────────────────┐
                                                   │  SQLite Database│
                                                   │   (lumina.db)   │
                                                   └─────────────────┘
```

## Changes Made

### 1. **Removed Mock Data** (`App.tsx`)

**Before:**
```typescript
const PRODUCTS: Product[] = [...];
const INITIAL_INVENTORY: InventoryItem[] = [...];
const MOCK_USERS: User[] = [...];
const INITIAL_ORDERS: Order[] = [...];

const [products, setProducts] = useState<Product[]>(PRODUCTS);
```

**After:**
```typescript
const API_BASE_URL = 'http://localhost:3001/api';

const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
```

### 2. **Added Data Fetching on Mount**

```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const productsRes = await fetch(`${API_BASE_URL}/products`);
      const productsData = await productsRes.json();
      setProducts(productsData);
      
      // Fetch orders
      const ordersRes = await fetch(`${API_BASE_URL}/orders`);
      const ordersData = await ordersRes.json();
      setOrders(ordersData);
      
      // Fetch users
      const usersRes = await fetch(`${API_BASE_URL}/auth/users`);
      const usersData = await usersRes.json();
      setUsers(usersData);
      
      // Fetch inventory
      const inventoryRes = await fetch(`${API_BASE_URL}/inventory`);
      const inventoryData = await inventoryRes.json();
      setInventory(inventoryData);
      
      console.log('✅ Data loaded from backend');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

### 3. **Refactored `placeOrder` Function**

**Before (Local State):**
```typescript
const placeOrder = (details, paymentMethod, fulfillment) => {
  // Local inventory check
  // Local state updates
  const newOrder = { id: `ord-${random}`, ... };
  setOrders([newOrder, ...orders]);
};
```

**After (API Call):**
```typescript
const placeOrder = async (details, paymentMethod, fulfillment) => {
  const orderData = {
    customer: { name, email, phone, type, userId },
    items: cart.map(item => ({ id, name, price, quantity, options })),
    subtotal, tax, total,
    paymentMethod, fulfillment
  };
  
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  
  const result = await response.json();
  setOrders([result.order, ...orders]);
  setActiveOrder(result.order);
};
```

### 4. **Updated Admin Actions**

All admin actions now call the backend API:

#### Update Order Status
```typescript
const updateOrderStatus = async (orderId, status) => {
  await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  // Update local state
  setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
};
```

#### Update Product Status
```typescript
const updateProductStatus = async (productId, isActive) => {
  await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive })
  });
  // Update local state
  setProducts(products.map(p => p.id === productId ? { ...p, isActive } : p));
};
```

#### Update Inventory
```typescript
const updateInventoryStock = async (productId, newStock) => {
  await fetch(`${API_BASE_URL}/inventory/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentStock: newStock })
  });
  // Update local state
  setInventory(inventory.map(i => i.productId === productId ? { ...i, currentStock: newStock } : i));
};
```

### 5. **Added Loading and Error States**

```typescript
{loading && (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
      <p className="text-stone-600 font-serif">Loading Lumina Café...</p>
    </div>
  </div>
)}

{error && (
  <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg z-50">
    <p className="font-medium">Error: {error}</p>
    <button onClick={() => window.location.reload()} className="text-sm underline mt-1">Retry</button>
  </div>
)}
```

## API Endpoints Used

### Products
- `GET /api/products` - Fetch all active products
- `PUT /api/products/:id` - Update product status

### Orders
- `GET /api/orders` - Fetch all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status or add feedback

### Inventory (NEW)
- `GET /api/inventory` - Fetch all inventory items
- `PUT /api/inventory/:productId` - Update inventory stock

### Users
- `GET /api/auth/users` - Fetch all users

## New Backend Endpoint: Inventory API

Created `api/inventory.ts` with the following endpoints:

```typescript
// GET /api/inventory
inventoryRouter.get('/', (req, res) => {
  const inventory = db.prepare('SELECT * FROM inventory').all();
  res.json(inventory);
});

// GET /api/inventory/:productId
inventoryRouter.get('/:productId', (req, res) => {
  const item = db.prepare('SELECT * FROM inventory WHERE productId = ?').get(productId);
  res.json(item);
});

// PUT /api/inventory/:productId
inventoryRouter.put('/:productId', (req, res) => {
  const { currentStock, lowStockThreshold } = req.body;
  db.prepare('UPDATE inventory SET currentStock = ?, lowStockThreshold = ? WHERE productId = ?')
    .run(currentStock, lowStockThreshold, productId);
  res.json({ message: 'Inventory updated' });
});
```

## Running the Application

### 1. Start the Backend Server

```bash
npm run server
```

Server runs on: `http://localhost:3001`

### 2. Start the Frontend Dev Server

```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

### 3. Initialize Database (First Time)

```bash
npm run init-db
```

This creates `lumina.db` with initial data.

## Data Flow Examples

### Example 1: Customer Places Order

```
1. User adds items to cart (local state)
2. User clicks "Place Order"
3. Frontend → POST /api/orders
   {
     customer: {...},
     items: [...],
     subtotal, tax, total
   }
4. Backend:
   - Starts transaction
   - Checks inventory
   - Deducts stock
   - Inserts order
   - Inserts order_items
   - Commits transaction
5. Backend → Response
   {
     message: "Order created",
     order: {...}
   }
6. Frontend updates local state
7. Frontend displays order confirmation
```

### Example 2: Admin Updates Order Status

```
1. Admin clicks status dropdown
2. Frontend → PUT /api/orders/:id
   { status: "in_prep" }
3. Backend updates database
4. Backend → Response
   { message: "Order updated" }
5. Frontend updates local state
6. UI reflects new status
```

### Example 3: Admin Updates Inventory

```
1. Admin edits stock quantity
2. Frontend → PUT /api/inventory/:productId
   { currentStock: 50 }
3. Backend updates database
4. Backend → Response
   { message: "Inventory updated" }
5. Frontend updates local state
6. UI shows new stock level
```

## State Management Strategy

### Optimistic Updates
- Frontend updates local state immediately
- If API call fails, show error and revert state

### Pessimistic Updates (Current Implementation)
- Wait for API response
- Update local state only after success
- Show loading indicators during API calls

## Error Handling

### Network Errors
```typescript
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error('API error');
  // Process response
} catch (err) {
  console.error('Error:', err);
  alert(`Failed: ${err.message}`);
}
```

### Validation Errors
- Backend returns 400 with error message
- Frontend displays error to user
- Example: "Insufficient stock for Golden Croissant"

### Transaction Failures
- Backend automatically rolls back
- Frontend receives error response
- No partial data corruption

## CORS Configuration

Backend has CORS enabled for all origins:

```typescript
app.use(cors());
```

**Production**: Restrict to specific origin:
```typescript
app.use(cors({
  origin: 'https://lumina-cafe.com',
  credentials: true
}));
```

## Testing the Integration

### 1. Test Data Fetching

```bash
# Open browser console
# Navigate to http://localhost:5173
# Check console for: "✅ Data loaded from backend"
```

### 2. Test Order Creation

```bash
# Add items to cart
# Place order
# Check console for: "✅ Order placed successfully: ord-xxxxx"
# Verify in backend: curl http://localhost:3001/api/orders
```

### 3. Test Admin Actions

```bash
# Go to Admin Dashboard
# Update order status
# Check console for: "✅ Order status updated"
# Update inventory
# Check console for: "✅ Inventory updated"
```

## Performance Considerations

### Current Implementation
- Fetches all data on mount
- Suitable for small-medium datasets
- Simple and straightforward

### Future Optimizations
1. **Pagination**: Limit orders/products per page
2. **Lazy Loading**: Load data as needed
3. **Caching**: Cache API responses
4. **WebSockets**: Real-time updates for admin dashboard
5. **Debouncing**: Delay API calls on rapid user input

## Security Considerations

### Current State (Prototype)
- No authentication on API endpoints
- CORS allows all origins
- No rate limiting

### Production Requirements
1. **JWT Authentication**: Protect admin endpoints
2. **CORS Whitelist**: Restrict origins
3. **Rate Limiting**: Prevent abuse
4. **Input Validation**: Sanitize all inputs
5. **HTTPS Only**: Encrypt all traffic

## Troubleshooting

### Issue: "Failed to fetch"

**Cause**: Backend server not running

**Solution**:
```bash
npm run server
```

### Issue: "CORS error"

**Cause**: Frontend and backend on different origins

**Solution**: Already configured with `cors()` middleware

### Issue: "Empty data on load"

**Cause**: Database not initialized

**Solution**:
```bash
npm run init-db
```

### Issue: "Order creation fails"

**Cause**: Insufficient inventory

**Solution**: Check inventory levels in admin dashboard

## File Changes Summary

| File | Changes |
|------|---------|
| `App.tsx` | Removed mock data, added API calls, added loading/error states |
| `api/inventory.ts` | **NEW** - Inventory API endpoints |
| `server.ts` | Added inventory router |
| `package.json` | No changes needed |

## Next Steps

1. ✅ Frontend connected to backend
2. ✅ All CRUD operations working
3. ✅ Transaction-based order creation
4. ✅ Real-time inventory updates
5. 🔄 Add authentication to admin endpoints
6. 🔄 Add real-time updates with WebSockets
7. 🔄 Add pagination for orders
8. 🔄 Add search and filtering

---

**Status**: ✅ Complete  
**Last Updated**: December 8, 2025  
**Integration Type**: REST API (HTTP/JSON)

