# Reset Guide - Lumina Café

## Quick Reset Commands

### Option 1: Reset Database Only (Recommended)

```bash
npm run reset-db
```

**What it does:**
- ✅ Deletes all orders
- ✅ Deletes all order items
- ✅ Resets inventory to initial stock levels
- ✅ Resets customer statistics (totalOrders, totalSpent)
- ✅ Keeps products, users, and structure intact

**Use when:**
- Testing order flow
- Clearing test orders
- Resetting inventory
- Starting fresh demo

### Option 2: Reset localStorage (Browser)

**Method 1 - Browser Console:**
```javascript
// Clear all Lumina data
localStorage.removeItem('lumina_view');
localStorage.removeItem('lumina_cart');
localStorage.removeItem('lumina_activeOrder');
localStorage.removeItem('lumina_adminUser');
console.log('✅ Lumina localStorage cleared');
```

**Method 2 - HTML Tool:**
```bash
# Open in browser
open scripts/clear-localstorage.html
```

Then click "Clear All Lumina Data" button.

**What it does:**
- ✅ Clears shopping cart
- ✅ Clears active order tracking
- ✅ Logs out admin
- ✅ Resets view to landing page

**Use when:**
- Stuck on a page
- Cart has issues
- Admin session problems
- Want to start fresh session

### Option 3: Full Reset (Database + localStorage)

```bash
# 1. Reset database
npm run reset-db

# 2. Clear localStorage
# Open browser console (F12) and run:
localStorage.clear();

# 3. Refresh page
# Press F5 or Cmd+R
```

**Use when:**
- Complete fresh start needed
- Major testing session
- Demo preparation

### Option 4: Complete Wipe & Reinitialize

```bash
# 1. Stop servers
pkill -f "tsx server.ts"
pkill -f "vite"

# 2. Delete database
rm lumina.db

# 3. Reinitialize
npm run init-db

# 4. Clear browser
# Open browser console:
localStorage.clear();

# 5. Restart servers
npm run server &
npm run dev
```

**Use when:**
- Database corrupted
- Schema changes
- Starting completely fresh

## Reset Script Details

### What Gets Reset

#### Database (`npm run reset-db`)

**Deleted:**
- ❌ All orders
- ❌ All order_items
- ❌ Customer order history

**Reset:**
- 🔄 Inventory stock levels → Initial values
- 🔄 Customer totalOrders → 0
- 🔄 Customer totalSpent → 0

**Preserved:**
- ✅ Products (all 6 items)
- ✅ Users (admin, employee, customer)
- ✅ User passwords
- ✅ Database structure

#### Initial Inventory Values

| Product | Stock |
|---------|-------|
| Velvet Latte | 150 shots |
| Cold Brew Noir | 40 cups |
| Matcha Cloud | 80 servings |
| Golden Croissant | 12 pcs |
| Cortado | 150 shots |
| Lavender Haze | 200 pumps |

### localStorage Keys

**Cleared:**
- `lumina_view` - Current page
- `lumina_cart` - Shopping cart items
- `lumina_activeOrder` - Order tracking
- `lumina_adminUser` - Admin session

## Step-by-Step Reset Procedures

### Scenario 1: Reset for Testing

**Goal:** Clear test orders, keep everything else

```bash
# 1. Reset database
npm run reset-db

# 2. Refresh browser
# Press F5

# 3. Done!
```

**Result:**
- ✅ No orders
- ✅ Fresh inventory
- ✅ Products still there
- ✅ Users still there
- ✅ Can start testing immediately

### Scenario 2: Reset User Session

**Goal:** Clear cart and logout

```javascript
// In browser console (F12)
localStorage.removeItem('lumina_cart');
localStorage.removeItem('lumina_activeOrder');
localStorage.removeItem('lumina_adminUser');
location.reload();
```

**Result:**
- ✅ Cart empty
- ✅ No active order
- ✅ Logged out
- ✅ Back to landing page

### Scenario 3: Demo Preparation

**Goal:** Clean slate for demo

```bash
# 1. Full database reset
npm run reset-db

# 2. Clear browser data
# Open browser console:
localStorage.clear();
sessionStorage.clear();

# 3. Close all browser tabs
# 4. Restart servers
pkill -f "tsx server.ts"
pkill -f "vite"
npm run server &
npm run dev

# 5. Open fresh browser tab
open http://localhost:5173
```

**Result:**
- ✅ Completely fresh system
- ✅ No test data
- ✅ Clean analytics
- ✅ Ready for demo

## Verification

### After Database Reset

```bash
# Check orders count (should be 0)
npx tsx -e "import { getDb } from './lib/db.js'; const db = getDb(); console.log('Orders:', db.prepare('SELECT COUNT(*) as count FROM orders').get());"

# Check inventory
npx tsx -e "import { getDb } from './lib/db.js'; const db = getDb(); console.log('Inventory:', db.prepare('SELECT productId, currentStock FROM inventory').all());"
```

### After localStorage Clear

```javascript
// In browser console
console.log('Cart:', localStorage.getItem('lumina_cart'));
console.log('Order:', localStorage.getItem('lumina_activeOrder'));
console.log('Admin:', localStorage.getItem('lumina_adminUser'));
// All should be null
```

## Automated Reset Script

### Create reset-all.sh

```bash
#!/bin/bash
echo "🔄 Full System Reset"
echo ""

# Stop servers
echo "1. Stopping servers..."
pkill -f "tsx server.ts"
pkill -f "vite"
sleep 2

# Reset database
echo "2. Resetting database..."
npm run reset-db

# Instructions for browser
echo ""
echo "3. Clear browser localStorage:"
echo "   - Open browser console (F12)"
echo "   - Run: localStorage.clear()"
echo "   - Refresh page (F5)"
echo ""

# Restart servers
echo "4. Restarting servers..."
npm run server &
sleep 3
npm run dev &

echo ""
echo "✅ System reset complete!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔌 Backend: http://localhost:3001"
```

## What Happens After Reset

### Database Reset

**Before:**
- 50 orders in system
- Inventory depleted
- Customer stats accumulated

**After:**
- 0 orders
- Inventory at 100%
- Customer stats at 0
- Analytics show clean slate

### localStorage Reset

**Before:**
- Cart has items
- Tracking an order
- Logged in as admin

**After:**
- Cart empty
- No active order
- Logged out
- On landing page

## Analytics After Reset

### Dashboard Shows

```
Total Revenue: $0.00
Total Orders: 0
Avg Order Value: $0.00
Customer Rating: 0.0/5
Completion Rate: 0%

Top Products: (empty)
Revenue by Category: (empty)
```

**This is normal after reset!**

## Troubleshooting

### Issue: Reset Script Fails

**Error:** "Database locked"

**Solution:**
```bash
# Stop server first
pkill -f "tsx server.ts"
sleep 2

# Then reset
npm run reset-db
```

### Issue: Orders Still Showing

**Cause:** Browser cache or localStorage

**Solution:**
```javascript
// Clear localStorage
localStorage.clear();

// Hard refresh
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Issue: Inventory Not Reset

**Cause:** Script didn't run completely

**Solution:**
```bash
# Manual reset
npx tsx -e "
import { getDb } from './lib/db.js';
const db = getDb();
db.prepare('UPDATE inventory SET currentStock = 150 WHERE productId = \"1\"').run();
db.prepare('UPDATE inventory SET currentStock = 40 WHERE productId = \"2\"').run();
db.prepare('UPDATE inventory SET currentStock = 80 WHERE productId = \"3\"').run();
db.prepare('UPDATE inventory SET currentStock = 12 WHERE productId = \"4\"').run();
db.prepare('UPDATE inventory SET currentStock = 150 WHERE productId = \"5\"').run();
db.prepare('UPDATE inventory SET currentStock = 200 WHERE productId = \"6\"').run();
console.log('✅ Inventory reset manually');
"
```

## Best Practices

### Before Demo

1. Run `npm run reset-db`
2. Clear browser localStorage
3. Restart servers
4. Test one complete flow
5. Reset again if needed

### During Development

1. Reset database frequently
2. Keep localStorage for convenience
3. Only full reset when needed

### Before Production

1. **DO NOT** run reset scripts
2. Backup database first
3. Use migration scripts instead

## Safety

### What's Safe

- ✅ `npm run reset-db` - Safe, reversible
- ✅ `localStorage.clear()` - Safe, local only
- ✅ Restarting servers - Safe

### What's Dangerous

- ⚠️ `rm lumina.db` - Deletes everything
- ⚠️ Manual SQL DELETE without WHERE - Dangerous
- ⚠️ Modifying schema without backup - Risky

## Quick Reference

| Command | What It Does | Safe? |
|---------|--------------|-------|
| `npm run reset-db` | Clear orders, reset inventory | ✅ Yes |
| `npm run init-db` | Initialize fresh database | ✅ Yes |
| `localStorage.clear()` | Clear browser data | ✅ Yes |
| `rm lumina.db` | Delete entire database | ⚠️ Careful |
| `pkill -f "tsx"` | Stop servers | ✅ Yes |

---

**Choose your reset option above based on what you need!** 🔄

For most cases, just run:
```bash
npm run reset-db
```

Then refresh your browser! ✨

