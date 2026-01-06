# Admin Reset Buttons - Analytics Dashboard

## Overview

The Analytics dashboard now has **4 reset buttons** in the top-right corner, allowing admins to quickly reset different parts of the system with a single click.

## Reset Buttons

### Location

**Top-right corner of Analytics view**

```
┌─────────────────────────────────────────────────────────┐
│  Analytics & KPIs                                       │
│                                                         │
│  [Reset Feedback] [Reset Orders] [Reset Inventory] [Reset All] │
└─────────────────────────────────────────────────────────┘
```

### Button Details

#### 1. Reset Feedback (Amber)
- **Icon:** ↻ (Rotate)
- **Color:** Amber/Yellow
- **Action:** Clears all customer feedback
- **Keeps:** Orders, revenue, inventory
- **Use:** Start fresh with ratings

#### 2. Reset Orders (Blue)
- **Icon:** ↻ (Rotate)
- **Color:** Blue
- **Action:** Deletes all orders and order items
- **Keeps:** Products, users, inventory levels
- **Use:** Clear test orders

#### 3. Reset Inventory (Purple)
- **Icon:** ↻ (Rotate)
- **Color:** Purple
- **Action:** Restores inventory to initial stock levels
- **Keeps:** Orders, products, users
- **Use:** Replenish all stock

#### 4. Reset All Data (Red)
- **Icon:** 🗑️ (Trash)
- **Color:** Red
- **Action:** Complete reset (orders + inventory + feedback + stats)
- **Keeps:** Products and users only
- **Use:** Complete fresh start

## What Each Button Does

### Reset Feedback

**Deletes:**
- ❌ All customer ratings
- ❌ All feedback comments
- ❌ Feedback timestamps

**Result:**
- Average Rating: 0.0/5
- Feedback Count: 0
- Orders still exist (without feedback)

**API Call:**
```
POST /api/admin/reset-feedback
```

### Reset Orders

**Deletes:**
- ❌ All orders
- ❌ All order items
- ❌ Order history

**Result:**
- Total Orders: 0
- Total Revenue: $0.00
- Analytics reset to zero
- Inventory levels unchanged

**API Call:**
```
POST /api/admin/reset-orders
```

### Reset Inventory

**Resets:**
- 🔄 Velvet Latte → 150 shots
- 🔄 Cold Brew Noir → 40 cups
- 🔄 Matcha Cloud → 80 servings
- 🔄 Golden Croissant → 12 pcs
- 🔄 Cortado → 150 shots
- 🔄 Lavender Haze → 200 pumps

**Result:**
- All stock at 100%
- No low stock alerts
- Orders and revenue unchanged

**API Call:**
```
POST /api/admin/reset-inventory
```

### Reset All Data

**Deletes:**
- ❌ All orders
- ❌ All order items
- ❌ All feedback

**Resets:**
- 🔄 Inventory to initial levels
- 🔄 Customer totalOrders to 0
- 🔄 Customer totalSpent to $0

**Result:**
- Complete fresh start
- Like running `npm run init-db` again
- Products and users preserved

**API Call:**
```
POST /api/admin/reset-all
```

## User Experience

### Click Flow

1. **Click button** (e.g., "Reset Feedback")
2. **Confirmation dialog** appears:
   ```
   Are you sure you want to reset feedback? 
   This cannot be undone.
   
   [Cancel]  [OK]
   ```
3. **Click OK**
4. **Button shows loading** (disabled state)
5. **API call executes**
6. **Success alert** appears:
   ```
   ✅ Feedback reset successfully!
   ```
7. **Page refreshes** automatically
8. **Analytics show reset values**

### Confirmation Dialog

**Safety Feature:**
- Prevents accidental resets
- Shows clear warning
- Requires explicit confirmation
- Can cancel anytime

### Loading State

**While resetting:**
- Button disabled
- Other buttons disabled
- Prevents double-clicks
- Shows processing state

## Real-Time Updates

### WebSocket Broadcast

When reset happens:

```typescript
// Backend emits to all admins
io.to('admin-room').emit('data-reset', { 
  type: 'feedback' // or 'orders', 'inventory', 'all'
});
```

**Result:**
- All admin windows receive event
- All admins see the reset
- Coordinated team experience

### Analytics Recalculation

**After reset:**
1. Page refreshes
2. Fetches fresh data from backend
3. Analytics recalculate
4. KPIs show new values
5. Charts update

**Time:** < 1 second for complete refresh

## API Endpoints

### POST /api/admin/reset-feedback

**Request:**
```bash
curl -X POST http://localhost:3001/api/admin/reset-feedback
```

**Response:**
```json
{
  "message": "Feedback reset successfully",
  "feedbackCleared": 15
}
```

### POST /api/admin/reset-orders

**Request:**
```bash
curl -X POST http://localhost:3001/api/admin/reset-orders
```

**Response:**
```json
{
  "message": "Orders reset successfully",
  "ordersDeleted": 25,
  "orderItemsDeleted": 50
}
```

### POST /api/admin/reset-inventory

**Request:**
```bash
curl -X POST http://localhost:3001/api/admin/reset-inventory
```

**Response:**
```json
{
  "message": "Inventory reset successfully",
  "itemsUpdated": 6
}
```

### POST /api/admin/reset-all

**Request:**
```bash
curl -X POST http://localhost:3001/api/admin/reset-all
```

**Response:**
```json
{
  "message": "Complete reset successful",
  "ordersDeleted": 25,
  "orderItemsDeleted": 50,
  "inventoryReset": 6,
  "userStatsReset": true
}
```

## Use Cases

### Use Case 1: Demo Preparation

**Scenario:** Preparing for a demo/presentation

**Steps:**
1. Go to Analytics view
2. Click **"Reset All Data"**
3. Confirm
4. ✅ Clean slate ready for demo

### Use Case 2: Testing Feedback System

**Scenario:** Testing feedback features

**Steps:**
1. Collect test feedback
2. Click **"Reset Feedback"**
3. ✅ Feedback cleared, orders remain
4. Test again with fresh data

### Use Case 3: Inventory Replenishment

**Scenario:** Simulating stock replenishment

**Steps:**
1. Inventory depleted from testing
2. Click **"Reset Inventory"**
3. ✅ All stock restored to 100%
4. Continue testing

### Use Case 4: Clear Test Orders

**Scenario:** Remove test orders, keep real data

**Steps:**
1. Testing created many fake orders
2. Click **"Reset Orders"**
3. ✅ Orders cleared
4. Analytics reset
5. Inventory unchanged

## Visual Design

### Button Styles

**Reset Feedback (Amber):**
```css
background: amber-50
hover: amber-100
text: amber-700
border: amber-200
```

**Reset Orders (Blue):**
```css
background: blue-50
hover: blue-100
text: blue-700
border: blue-200
```

**Reset Inventory (Purple):**
```css
background: purple-50
hover: purple-100
text: purple-700
border: purple-200
```

**Reset All (Red):**
```css
background: red-50
hover: red-100
text: red-700
border: red-200
```

### Icons

- Reset buttons: ↻ (RotateCcw)
- Reset All: 🗑️ (Trash2)

## Console Output

### Reset Feedback

```
🔄 Reset: Cleared feedback from 15 orders
✅ Reset successful: { message: "Feedback reset successfully", feedbackCleared: 15 }
```

### Reset Orders

```
🔄 Reset: Deleted 25 orders and 50 order items
✅ Reset successful: { message: "Orders reset successfully", ... }
```

### Reset Inventory

```
🔄 Reset: Inventory restored to initial levels
✅ Reset successful: { message: "Inventory reset successfully", itemsUpdated: 6 }
```

### Reset All

```
🔄 Complete Reset: All data reset to initial state
✅ Reset successful: { message: "Complete reset successful", ... }
```

## Safety Features

### 1. Confirmation Dialog

```javascript
if (!confirm('Are you sure? This cannot be undone.')) {
  return; // Cancel
}
```

### 2. Disabled During Reset

```typescript
disabled={resetting !== null}
```

Prevents:
- Double-clicking
- Multiple simultaneous resets
- Race conditions

### 3. Error Handling

```typescript
try {
  await fetch('/api/admin/reset-...');
  alert('✅ Reset successful!');
} catch (error) {
  alert('❌ Failed to reset');
}
```

### 4. Explicit Actions

- Must click button
- Must confirm dialog
- No accidental resets

## Analytics After Reset

### After Reset Feedback

```
Customer Rating: 0.0/5
Feedback Count: 0 reviews
```

**Other metrics unchanged**

### After Reset Orders

```
Total Revenue: $0.00
Total Orders: 0
Avg Order Value: $0.00
Completion Rate: 0%
Top Products: (empty)
Revenue by Category: (empty)
Payment Methods: (empty)
```

**Inventory unchanged**

### After Reset Inventory

```
Velvet Latte: 150 shots ✅
Cold Brew Noir: 40 cups ✅
Matcha Cloud: 80 servings ✅
Golden Croissant: 12 pcs ✅
Cortado: 150 shots ✅
Lavender Haze: 200 pumps ✅

Low Stock: 0
Out of Stock: 0
```

**Orders and revenue unchanged**

### After Reset All

**Everything reset to initial state:**
- Orders: 0
- Revenue: $0.00
- Inventory: 100%
- Feedback: 0
- Customer stats: 0

## Testing

### Test Reset Feedback

1. **Have some orders with feedback**
2. **Go to Analytics view**
3. **Click "Reset Feedback"**
4. **Confirm dialog**
5. **✅ Page refreshes**
6. **✅ Average Rating: 0.0/5**
7. **✅ Feedback Count: 0**
8. **✅ Orders still exist**

### Test Reset Orders

1. **Have some test orders**
2. **Go to Analytics view**
3. **Click "Reset Orders"**
4. **Confirm dialog**
5. **✅ Page refreshes**
6. **✅ Total Orders: 0**
7. **✅ Revenue: $0.00**
8. **✅ Inventory unchanged**

### Test Reset All

1. **System has data**
2. **Go to Analytics view**
3. **Click "Reset All Data"**
4. **Confirm dialog**
5. **✅ Page refreshes**
6. **✅ Everything reset**
7. **✅ Like brand new system**

## Security Considerations

### Current Implementation

- ⚠️ No authentication check
- ⚠️ Any admin can reset
- ⚠️ No audit log

### Production Recommendations

1. **Require Super Admin Role:**
   ```typescript
   if (adminUser.role !== 'super_admin') {
     return res.status(403).json({ error: 'Insufficient permissions' });
   }
   ```

2. **Add Audit Log:**
   ```typescript
   db.prepare('INSERT INTO audit_log (action, userId, timestamp) VALUES (?, ?, ?)
     .run('reset_orders', adminId, new Date().toISOString());
   ```

3. **Require Password Confirmation:**
   ```typescript
   // Ask for password before reset
   const { password } = req.body;
   if (!verifyPassword(password)) {
     return res.status(401).json({ error: 'Invalid password' });
   }
   ```

## Files Modified

- ✅ **`api/admin.ts`** - NEW file with reset endpoints
- ✅ **`server.ts`** - Added admin router
- ✅ **`pages/AdminDashboard.tsx`** - Added reset buttons
- ✅ **`ADMIN_RESET_BUTTONS.md`** - Documentation

## Summary

### What's Available

✅ **4 Reset Buttons** in Analytics view  
✅ **Confirmation Dialogs** for safety  
✅ **Real-Time Updates** via WebSocket  
✅ **Success Notifications** after reset  
✅ **Auto Page Refresh** to show new data  
✅ **Color-Coded Buttons** for clarity  
✅ **Disabled States** during reset  

### Benefits

🎯 **Quick Reset** - One-click operation  
🔒 **Safe** - Confirmation required  
⚡ **Fast** - Instant execution  
👥 **Team Sync** - All admins notified  
🎨 **Visual** - Color-coded by type  
📊 **Analytics Update** - Instant recalculation  

---

**Test it now!** 🎉

1. Login as admin
2. Go to "Analytics & KPIs" view
3. See 4 reset buttons in top-right
4. Click any button
5. Confirm the action
6. Watch analytics update instantly!

The buttons are color-coded and clearly labeled - you can't miss them! 🚀

