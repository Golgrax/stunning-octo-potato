import { Router, Request, Response } from 'express';
import { getDb } from '../lib/db';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { io } from '../server';

export const adminRouter = Router();

// POST /api/admin/reset-orders - Reset all orders and order items
adminRouter.post('/reset-orders', (req: Request, res: Response) => {
  const db = getDb();
  
  try {
    // Delete all orders and order items
    const ordersDeleted = db.prepare('DELETE FROM orders').run();
    const orderItemsDeleted = db.prepare('DELETE FROM order_items').run();
    
    console.log(`🔄 Reset: Deleted ${ordersDeleted.changes} orders and ${orderItemsDeleted.changes} order items`);
    
    // Emit WebSocket event to all admins
    io.to('admin-room').emit('data-reset', { type: 'orders' });
    
    return res.status(200).json({ 
      message: 'Orders reset successfully',
      ordersDeleted: ordersDeleted.changes,
      orderItemsDeleted: orderItemsDeleted.changes
    });
  } catch (error) {
    console.error('Error resetting orders:', error);
    return res.status(500).json({ error: 'Failed to reset orders' });
  }
});

// POST /api/admin/reset-inventory - Reset inventory to initial values
adminRouter.post('/reset-inventory', (req: Request, res: Response) => {
  const db = getDb();
  
  try {
    // Reset to initial stock levels
    const updates = [
      { productId: '1', stock: 150 },
      { productId: '2', stock: 40 },
      { productId: '3', stock: 80 },
      { productId: '4', stock: 12 },
      { productId: '5', stock: 150 },
      { productId: '6', stock: 200 }
    ];
    
    const stmt = db.prepare('UPDATE inventory SET currentStock = ? WHERE productId = ?');
    
    updates.forEach(({ productId, stock }) => {
      stmt.run(stock, productId);
    });
    
    console.log('🔄 Reset: Inventory restored to initial levels');
    
    // Emit WebSocket event
    io.to('admin-room').emit('data-reset', { type: 'inventory' });
    
    return res.status(200).json({ 
      message: 'Inventory reset successfully',
      itemsUpdated: updates.length
    });
  } catch (error) {
    console.error('Error resetting inventory:', error);
    return res.status(500).json({ error: 'Failed to reset inventory' });
  }
});

// POST /api/admin/reset-feedback - Clear all feedback
adminRouter.post('/reset-feedback', (req: Request, res: Response) => {
  const db = getDb();
  
  try {
    // Clear feedback from all orders
    const result = db.prepare(`
      UPDATE orders 
      SET feedbackRating = NULL, 
          feedbackComment = NULL, 
          feedbackTimestamp = NULL
    `).run();
    
    console.log(`🔄 Reset: Cleared feedback from ${result.changes} orders`);
    
    // Emit WebSocket event
    io.to('admin-room').emit('data-reset', { type: 'feedback' });
    
    return res.status(200).json({ 
      message: 'Feedback reset successfully',
      feedbackCleared: result.changes
    });
  } catch (error) {
    console.error('Error resetting feedback:', error);
    return res.status(500).json({ error: 'Failed to reset feedback' });
  }
});

// POST /api/admin/reset-all - Reset everything (orders, inventory, feedback, user stats)
adminRouter.post('/reset-all', (req: Request, res: Response) => {
  const db = getDb();
  
  try {
    // Delete orders and order items
    const ordersDeleted = db.prepare('DELETE FROM orders').run();
    const orderItemsDeleted = db.prepare('DELETE FROM order_items').run();
    
    // Reset inventory
    const updates = [
      { productId: '1', stock: 150 },
      { productId: '2', stock: 40 },
      { productId: '3', stock: 80 },
      { productId: '4', stock: 12 },
      { productId: '5', stock: 150 },
      { productId: '6', stock: 200 }
    ];
    
    const inventoryStmt = db.prepare('UPDATE inventory SET currentStock = ? WHERE productId = ?');
    updates.forEach(({ productId, stock }) => {
      inventoryStmt.run(stock, productId);
    });
    
    // Reset customer stats
    db.prepare('UPDATE users SET totalOrders = 0, totalSpent = 0 WHERE role = ?').run('customer');
    
    console.log('🔄 Complete Reset: All data reset to initial state');
    
    // Emit WebSocket event
    io.to('admin-room').emit('data-reset', { type: 'all' });
    
    return res.status(200).json({ 
      message: 'Complete reset successful',
      ordersDeleted: ordersDeleted.changes,
      orderItemsDeleted: orderItemsDeleted.changes,
      inventoryReset: updates.length,
      userStatsReset: true
    });
  } catch (error) {
    console.error('Error performing complete reset:', error);
    return res.status(500).json({ error: 'Failed to perform complete reset' });
  }
});

// Vercel serverless function handler (for backward compatibility)
export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented in serverless mode' });
}

