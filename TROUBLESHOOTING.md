# Troubleshooting Guide - Lumina Café

## Common Issues and Solutions

### Issue 1: Stuck on Order Status Screen ✅ FIXED

**Problem:** After placing an order, clicking "Place Another Order" doesn't return to the menu. The app stays stuck on the order tracking view.

**Root Cause:** The `activeOrder` state was not being cleared when navigating back to the menu.

**Solution:**
1. Added `clearActiveOrder` function in `App.tsx`:
   ```typescript
   const clearActiveOrder = () => setActiveOrder(null);
   ```

2. Passed function to `CustomerView`:
   ```typescript
   <CustomerView 
     ...
     clearActiveOrder={clearActiveOrder}
   />
   ```

3. Updated "Place Another Order" button in `CustomerView.tsx`:
   ```typescript
   <Button onClick={() => {
     clearActiveOrder();
     setCurrentScreen('menu');
   }}>Place Another Order</Button>
   ```

**Status:** ✅ Fixed

---

### Issue 2: Backend Server Not Running

**Problem:** Frontend shows "Failed to fetch" errors.

**Symptoms:**
- Loading spinner never stops
- Error message: "Failed to fetch products"
- Console errors about network requests

**Solution:**
```bash
# Start the backend server
npm run server

# Verify it's running
curl http://localhost:3001/health
```

**Expected Response:**
```json
{"status":"ok","timestamp":"2025-12-08T..."}
```

---

### Issue 3: Database Not Initialized

**Problem:** Backend returns empty arrays or "not found" errors.

**Symptoms:**
- Products list is empty
- No orders or users in admin dashboard
- Console shows: "0 products loaded"

**Solution:**
```bash
# Initialize the database
npm run init-db

# Verify database exists
ls -lh lumina.db
```

**Expected Output:**
```
✅ Data loaded from backend
   - Products: 6
   - Inventory items: 6
   - Orders: 0
   - Users: 3
```

---

### Issue 4: CORS Errors

**Problem:** Browser console shows CORS policy errors.

**Symptoms:**
```
Access to fetch at 'http://localhost:3001/api/products' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solution:**
The server already has CORS enabled. If you still see this error:

1. Check server is running on port 3001
2. Restart the server:
   ```bash
   pkill -f "tsx server.ts"
   npm run server
   ```

---

### Issue 5: Order Creation Fails

**Problem:** Order placement returns error or fails silently.

**Possible Causes:**

#### A. Insufficient Inventory
**Error:** "Insufficient stock for [Product Name]"

**Solution:**
1. Go to Admin Dashboard → Inventory
2. Update stock levels
3. Try ordering again

#### B. Invalid Customer Details
**Error:** "Missing required fields"

**Solution:**
- Ensure name and email are filled
- For delivery orders, ensure address is provided

#### C. Network Error
**Error:** "Failed to place order"

**Solution:**
1. Check backend server is running
2. Check browser console for detailed error
3. Verify database connection

---

### Issue 6: Admin Dashboard Functions Not Working

**Problem:** Updating order status, inventory, or product status doesn't work.

**Symptoms:**
- Clicking buttons does nothing
- Changes don't persist
- Console shows API errors

**Debugging Steps:**

1. **Check Backend Logs:**
   ```bash
   # Look at terminal running npm run server
   # Should show API requests and responses
   ```

2. **Test API Endpoints:**
   ```bash
   # Test order status update
   curl -X PUT http://localhost:3001/api/orders/ord-123 \
     -H "Content-Type: application/json" \
     -d '{"status":"in_prep"}'
   
   # Test inventory update
   curl -X PUT http://localhost:3001/api/inventory/1 \
     -H "Content-Type: application/json" \
     -d '{"currentStock":100}'
   ```

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for error messages
   - Check Network tab for failed requests

**Common Fixes:**
- Restart backend server
- Clear browser cache
- Check database file permissions
- Verify API endpoints match frontend calls

---

### Issue 7: Loading State Never Ends

**Problem:** App shows loading spinner indefinitely.

**Causes:**
1. Backend not responding
2. Network timeout
3. CORS blocking requests

**Solution:**
```bash
# 1. Check backend health
curl http://localhost:3001/health

# 2. Check backend logs for errors
# Look at terminal running npm run server

# 3. Restart both servers
pkill -f "tsx server.ts"
npm run server

# In another terminal
npm run dev
```

---

### Issue 8: Data Not Persisting

**Problem:** Changes are lost after page refresh.

**Symptoms:**
- Orders disappear
- Inventory resets
- User changes lost

**Cause:** Frontend state not syncing with backend.

**Solution:**
1. Verify API calls are completing:
   ```typescript
   // Check console for these messages
   ✅ Order placed successfully
   ✅ Order status updated
   ✅ Inventory updated
   ```

2. Check database file:
   ```bash
   # View recent orders
   sqlite3 lumina.db "SELECT * FROM orders ORDER BY timestamp DESC LIMIT 5;"
   ```

3. Verify functions are async:
   ```typescript
   const placeOrder = async (...) => { ... }
   const updateOrderStatus = async (...) => { ... }
   ```

---

### Issue 9: Timestamps Showing as Invalid Date

**Problem:** Order timestamps show "Invalid Date" in UI.

**Cause:** Date strings from API not being parsed correctly.

**Solution:**
The API returns ISO date strings. Ensure they're converted:
```typescript
// In App.tsx useEffect
const ordersData = await response.json();
const ordersWithDates = ordersData.map(o => ({
  ...o,
  timestamp: new Date(o.timestamp)
}));
setOrders(ordersWithDates);
```

---

### Issue 10: Cart Items Not Showing Correct Quantity

**Problem:** Cart shows wrong quantities or prices.

**Cause:** Quantity field not being properly passed to backend.

**Solution:**
Check the `placeOrder` function maps items correctly:
```typescript
items: cart.map(item => ({
  id: item.id,
  name: item.name,
  price: item.price,
  quantity: 1, // Update this if you have quantity tracking
  options: item.options
}))
```

---

## Diagnostic Commands

### Check System Status

```bash
# Check if backend is running
lsof -i :3001

# Check if frontend is running
lsof -i :5173

# Check database file
ls -lh lumina.db

# Check database contents
sqlite3 lumina.db "SELECT COUNT(*) FROM products;"
sqlite3 lumina.db "SELECT COUNT(*) FROM orders;"
sqlite3 lumina.db "SELECT COUNT(*) FROM users;"
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Get products
curl http://localhost:3001/api/products

# Get orders
curl http://localhost:3001/api/orders

# Get inventory
curl http://localhost:3001/api/inventory

# Get users
curl http://localhost:3001/api/auth/users
```

### Reset Everything

```bash
# Stop all processes
pkill -f "tsx server.ts"
pkill -f "vite"

# Delete database
rm lumina.db

# Reinitialize
npm run init-db

# Start servers
npm run server &
npm run dev
```

---

## Browser Console Debugging

### Expected Console Messages (Success)

```
✅ Data loaded from backend
✅ Order placed successfully: ord-1765209072912
✅ Order status updated
✅ Inventory updated
✅ Product status updated
✅ Feedback submitted
```

### Error Messages and Meanings

| Message | Meaning | Solution |
|---------|---------|----------|
| `Failed to fetch products` | Backend not responding | Start backend server |
| `Insufficient stock for...` | Not enough inventory | Update inventory in admin |
| `Invalid email or password` | Wrong credentials | Check CREDENTIALS.md |
| `Access denied` | Wrong role | Use admin/employee account |
| `Failed to create order` | Transaction error | Check backend logs |

---

## Performance Issues

### Slow Loading

**Cause:** Large dataset or slow network

**Solutions:**
1. Add pagination to orders list
2. Implement lazy loading
3. Add caching layer
4. Optimize database queries

### UI Lag

**Cause:** Too many re-renders

**Solutions:**
1. Use React.memo for expensive components
2. Implement useMemo for calculations
3. Debounce search inputs
4. Virtualize long lists

---

## Getting Help

### Information to Provide

When reporting issues, include:

1. **Browser Console Errors:**
   - Open DevTools (F12)
   - Copy error messages from Console tab

2. **Network Requests:**
   - Open DevTools → Network tab
   - Filter by "Fetch/XHR"
   - Check failed requests (red)
   - Copy request/response details

3. **Backend Logs:**
   - Copy output from terminal running `npm run server`

4. **Steps to Reproduce:**
   - Exact steps that cause the issue
   - Expected vs actual behavior

5. **Environment:**
   - Node version: `node --version`
   - npm version: `npm --version`
   - OS: macOS/Windows/Linux

---

## Quick Fixes Checklist

- [ ] Backend server running on port 3001
- [ ] Frontend dev server running on port 5173
- [ ] Database file exists (`lumina.db`)
- [ ] Database has data (run `npm run init-db`)
- [ ] No CORS errors in browser console
- [ ] No network errors in browser console
- [ ] API endpoints responding (test with curl)
- [ ] Browser cache cleared
- [ ] Both servers restarted recently

---

**Last Updated:** December 8, 2025  
**Version:** 1.0.0

